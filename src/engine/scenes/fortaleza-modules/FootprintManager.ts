import * as THREE from 'three';

// 1024x1024 gives ~25cm per pixel over a 256x256 world area
const MAP_SIZE = 1024;
const WORLD_SIZE = 256;
const WORLD_OFFSET_X = 0;
const WORLD_OFFSET_Z = -100;

export class FootprintManager {
    public targetA: THREE.WebGLRenderTarget;
    public targetB: THREE.WebGLRenderTarget;
    public currentTarget: number = 0;

    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private stampMesh: THREE.Mesh;
    private fadeMat: THREE.ShaderMaterial;
    private fadeMesh: THREE.Mesh;

    public uniformRef: THREE.IUniform<THREE.Texture>;

    constructor() {
        // Two render targets for ping-pong (reading from one, writing to the other)
        const rtOptions: THREE.RenderTargetOptions = {
            format: THREE.RedFormat,
            type: THREE.HalfFloatType, // HalfFloat is well supported and sufficient for 0-1 depth
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            depthBuffer: false,
            stencilBuffer: false,
        };
        this.targetA = new THREE.WebGLRenderTarget(MAP_SIZE, MAP_SIZE, rtOptions);
        this.targetB = new THREE.WebGLRenderTarget(MAP_SIZE, MAP_SIZE, rtOptions);

        this.uniformRef = { value: this.targetA.texture };

        // Orthographic scene to render the footprints
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            -WORLD_SIZE / 2, WORLD_SIZE / 2,
            WORLD_SIZE / 2, -WORLD_SIZE / 2,
            0, 1
        );

        // A simple soft circle brush to stamp new footprints
        const brushGeo = new THREE.PlaneGeometry(1.5, 1.5);
        const brushMat = new THREE.ShaderMaterial({
            uniforms: { uColor: { value: 1.0 } },
            vertexShader: `
                void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
            `,
            fragmentShader: `
                uniform float uColor;
                void main() {
                    float dist = length(vUv - 0.5) * 2.0;
                    float alpha = smoothstep(1.0, 0.2, dist);
                    gl_FragColor = vec4(vec3(uColor), alpha);
                }
            `,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        this.stampMesh = new THREE.Mesh(brushGeo, brushMat);
        this.scene.add(this.stampMesh);

        // A full-screen quad to fade the previous frame slightly
        this.fadeMat = new THREE.ShaderMaterial({
            uniforms: { uPrevTexture: { value: this.targetA.texture } },
            vertexShader: `
                varying vec2 vUv;
                void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
            `,
            fragmentShader: `
                uniform sampler2D uPrevTexture;
                varying vec2 vUv;
                void main() {
                    float prev = texture2D(uPrevTexture, vUv).r;
                    // Fade out slowly (retention rate: 0.995)
                    gl_FragColor = vec4(vec3(prev * 0.995), 1.0);
                }
            `,
            depthWrite: false
        });
        this.fadeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.fadeMat);
        // We will add/remove this mesh from scene dynamically during the update loop
    }

    public update(gl: THREE.WebGLRenderer, playerPosition: THREE.Vector3 | null) {
        const readTarget = this.currentTarget === 0 ? this.targetA : this.targetB;
        const writeTarget = this.currentTarget === 0 ? this.targetB : this.targetA;

        // 1. Draw full screen quad with previous texture to fade
        this.fadeMat.uniforms.uPrevTexture.value = readTarget.texture;
        this.scene.add(this.fadeMesh);

        // Hide stamp during fade copy
        this.stampMesh.visible = false;

        // We render to writeTarget, but this replaces entirely what was there.
        // Wait, standard render overrides. Since we want to copy the prev and add the new,
        // we first render the fade mesh (which has depthWrite:false and NO blending, just outright copy).
        // BUT we need to clear first or ensure it covers everything. The quad covers everything.
        const prevAutoClear = gl.autoClear;
        gl.autoClear = false;

        gl.setRenderTarget(writeTarget);
        gl.render(this.scene, this.camera);

        // 2. Draw the new footprint
        this.scene.remove(this.fadeMesh);
        this.stampMesh.visible = true;

        if (playerPosition) {
            // Map world position to our orthographic camera bounds
            this.stampMesh.position.set(
                playerPosition.x - WORLD_OFFSET_X,
                playerPosition.z - WORLD_OFFSET_Z,
                -0.5
            );
            gl.render(this.scene, this.camera);
        }

        gl.setRenderTarget(null);
        gl.autoClear = prevAutoClear;

        // Swap
        this.currentTarget = 1 - this.currentTarget;
        this.uniformRef.value = writeTarget.texture;
    }

    // Returns a chunk of GLSL code to inject into fragment shaders
    public getFragmentGLSL() {
        return `
            // Map world pos to footprint FBO UVs
            vec2 fboUV = vec2(
                (vWorldPos.x - (${WORLD_OFFSET_X}.0)) / ${WORLD_SIZE}.0 + 0.5,
                (vWorldPos.z - (${WORLD_OFFSET_Z}.0)) / ${WORLD_SIZE}.0 + 0.5
            );
            // Read footprint depth if within bounds
            float footprint = 0.0;
            if (fboUV.x >= 0.0 && fboUV.x <= 1.0 && fboUV.y >= 0.0 && fboUV.y <= 1.0) {
                footprint = texture2D(uFootprintMap, fboUV).r;
            }
            // Footprints melt/reduce the snow factor, revealing the dark rock
            snowFactor = max(0.0, snowFactor - footprint * 0.85);

            // Also make the normal slightly disturbed where footprints are (optional visual bump)
            // But just revealing the dark floor looks like an indentation already!
        `;
    }
}
