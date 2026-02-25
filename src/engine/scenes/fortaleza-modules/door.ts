import * as THREE from 'three';

export function createDoor(scene: THREE.Scene, collidables: THREE.Object3D[]) {
  function makeWoodTexture() {
    const w = 512, h = 1024;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#6f3f2b'; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 4) {
      const stripeWidth = 1 + Math.floor(Math.random() * 3);
      const shade = 10 + Math.random() * 30;
      ctx.fillStyle = `rgba(${80 - shade}, ${45 - shade * 0.25}, ${30 - shade * 0.15}, ${0.03 + Math.random() * 0.06})`;
      ctx.fillRect(x, 0, stripeWidth, h);
    }
    for (let i = 0; i < 4; i++) {
      const sx = Math.floor((i + 0.5) * (w / 4)) + (Math.random() * 12 - 6);
      ctx.strokeStyle = 'rgba(52,25,20,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + (Math.random() * 6 - 3), h); ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const kx = sx + (Math.random() - 0.5) * 60; const ky = Math.random() * h;
        ctx.beginPath(); ctx.ellipse(kx, ky, 12 + Math.random() * 10, 6 + Math.random() * 5, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(50,28,18,${0.08 + Math.random() * 0.16})`; ctx.fill();
      }
    }
    ctx.fillStyle = '#221a16';
    for (let y = 36; y < h; y += 72) {
      for (let x = 36; x < w; x += 64) {
        ctx.beginPath(); ctx.arc(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 8, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }
    const colorTex = new THREE.CanvasTexture(c); colorTex.wrapS = colorTex.wrapT = THREE.RepeatWrapping; colorTex.repeat.set(1, 1);

    const cb = document.createElement('canvas'); cb.width = 256; cb.height = 256; const bctx = cb.getContext('2d')!;
    for (let i = 0; i < 20000; i++) {
      const xx = Math.random() * cb.width; const yy = Math.random() * cb.height;
      const v = 150 + Math.floor(Math.random() * 80);
      bctx.fillStyle = `rgba(${v},${v},${v},${0.04 + Math.random() * 0.06})`; bctx.fillRect(xx, yy, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
    }
    const bumpTex = new THREE.CanvasTexture(cb); bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping; bumpTex.repeat.set(2, 4);

    return { color: colorTex, bump: bumpTex };
  }

  const woodTex = makeWoodTexture();
  const doorMat2 = new THREE.MeshStandardMaterial({ map: woodTex.color, bumpMap: woodTex.bump, bumpScale: 0.06, roughness: 0.86, metalness: 0.03 });
  const metalBandMat = new THREE.MeshStandardMaterial({ color: '#2c2c2c', metalness: 1.0, roughness: 0.25 });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#2f2a26', roughness: 0.6, metalness: 0.2 });
  const handleMat = new THREE.MeshStandardMaterial({ color: '#bfa074', metalness: 0.95, roughness: 0.25 });

  const doorGroup = new THREE.Group();
  const hingeOffsetX = 8; const panelW = 8; const panelH = 11.5; const panelDepth = 1.0;

  const leftHinge = new THREE.Group(); leftHinge.position.set(-hingeOffsetX, 0, 0); // Z será configurado en base a environment
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, panelDepth), doorMat2);
  leftPanel.position.set(panelW / 2, panelH / 2 - 0.05, 0); leftPanel.castShadow = true; leftHinge.add(leftPanel);
  leftHinge.userData = { panel: leftPanel, basePanelX: leftPanel.position.x };

  const bandL = new THREE.Mesh(new THREE.BoxGeometry(panelW + 0.4, 0.25, 0.35), metalBandMat); bandL.position.set(panelW / 2, 2.2, panelDepth / 2 + 0.02); leftHinge.add(bandL);
  const bandL2 = bandL.clone(); bandL2.position.y = panelH - 2.2; leftHinge.add(bandL2);
  for (let y = 2.8; y < panelH; y += 2.8) { const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 8), metalBandMat); stud.rotation.x = Math.PI / 2; stud.position.set(panelW - 0.6, y, panelDepth / 2 + 0.08); leftHinge.add(stud); }
  const handleGeom = new THREE.TorusGeometry(0.28, 0.06, 8, 16);
  const handleL = new THREE.Mesh(handleGeom, handleMat);
  handleL.rotation.x = Math.PI / 2; handleL.position.set(panelW - 2.4, panelH / 2, panelDepth / 2 + 0.08); leftHinge.add(handleL);
  doorGroup.add(leftHinge);

  const rightHinge = new THREE.Group(); rightHinge.position.set(hingeOffsetX, 0, 0);
  const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, panelDepth), doorMat2);
  rightPanel.position.set(-panelW / 2, panelH / 2 - 0.05, 0); rightPanel.castShadow = true; rightHinge.add(rightPanel);
  rightHinge.userData = { panel: rightPanel, basePanelX: rightPanel.position.x };

  const bandR = bandL.clone(); bandR.position.set(-panelW / 2, 2.2, panelDepth / 2 + 0.02); rightHinge.add(bandR);
  const bandR2 = bandL2.clone(); bandR2.position.set(-panelW / 2, panelH - 2.2, panelDepth / 2 + 0.02); rightHinge.add(bandR2);
  for (let y = 2.8; y < panelH; y += 2.8) { const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 8), metalBandMat); stud.rotation.x = Math.PI / 2; stud.position.set(-panelW + 0.6, y, panelDepth / 2 + 0.08); rightHinge.add(stud); }
  const handleGeomR = new THREE.TorusGeometry(0.28, 0.06, 8, 16);
  const handleR = new THREE.Mesh(handleGeomR, handleMat);
  handleR.rotation.x = Math.PI / 2; handleR.position.set(-panelW + 2.4, panelH / 2, panelDepth / 2 + 0.08); rightHinge.add(handleR);
  doorGroup.add(rightHinge);

  const doorColL = new THREE.Mesh(new THREE.BoxGeometry(panelW + 0.6, panelH + 0.6, 1.6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
  doorColL.position.copy(leftPanel.position); leftHinge.add(doorColL); collidables.push(doorColL);
  const doorColR = new THREE.Mesh(new THREE.BoxGeometry(panelW + 0.6, panelH + 0.6, 1.6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
  doorColR.position.copy(rightPanel.position); rightHinge.add(doorColR); collidables.push(doorColR);

  // door frame / lintel to hide clipping
  const frameGroup = new THREE.Group();
  const jambWidth = 2.5;
  const jambL = new THREE.Mesh(new THREE.BoxGeometry(jambWidth, panelH + 1, 2.0), frameMat);
  jambL.position.set(-hingeOffsetX - 3.8, (panelH + 1) / 2, 0); jambL.castShadow = true; frameGroup.add(jambL);
  const jambR = jambL.clone(); jambR.position.x = hingeOffsetX + 3.8; frameGroup.add(jambR);

  const innerLintel = new THREE.Mesh(new THREE.BoxGeometry(16, 1.5, 2.0), frameMat);
  innerLintel.position.set(0, panelH + 0.5, 0); innerLintel.castShadow = true; frameGroup.add(innerLintel);
  const threshold = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 2.0), frameMat);
  threshold.position.set(0, 0, 0); frameGroup.add(threshold);

  const paintedSealMat = new THREE.MeshStandardMaterial({ map: woodTex.color, color: '#5a2f22', roughness: 0.88, metalness: 0.02 });
  const topSeal = new THREE.Mesh(new THREE.BoxGeometry((hingeOffsetX + panelW / 2 + 0.9) * 2 - 0.6, 0.22, 0.95), paintedSealMat);
  topSeal.position.set(0, panelH - 0.04, 0); topSeal.visible = true; frameGroup.add(topSeal);

  const edgeSealGeom = new THREE.BoxGeometry(0.36, panelH - 0.4, 0.95);
  const leftEdgeSeal = new THREE.Mesh(edgeSealGeom, paintedSealMat); leftEdgeSeal.position.set(-0.18, panelH / 2 - 0.05, 0); leftEdgeSeal.visible = true; leftHinge.add(leftEdgeSeal);
  const rightEdgeSeal = leftEdgeSeal.clone(); rightEdgeSeal.position.x = 0.18; rightHinge.add(rightEdgeSeal);

  doorGroup.add(frameGroup);
  scene.add(doorGroup);

  return {
    group: doorGroup,
    leftHinge,
    rightHinge,
    doorColL,
    doorColR,
    panelW,
    animateDoor: (delta: number, doorState: number, doorOpenAmount: number) => {
      let openAmount = doorOpenAmount;
      if (doorState === 1 && openAmount < 1) openAmount += delta * 1.5;
      if (doorState === 2 && openAmount > 0) openAmount -= delta * 1.5;
      openAmount = THREE.MathUtils.clamp(openAmount, 0, 1);
      const ease = Math.sin(openAmount * Math.PI / 2);

      leftHinge.rotation.y = -ease * Math.PI * 0.6;
      rightHinge.rotation.y = ease * Math.PI * 0.6;

      if (doorState !== 0) leftHinge.userData.panel.position.x = leftHinge.userData.basePanelX - (ease * 0.3);
      if (doorState !== 0) rightHinge.userData.panel.position.x = rightHinge.userData.basePanelX + (ease * 0.3);

      // Bloquear raycast si está abierta
      doorColL.layers.set(ease > 0.8 ? 1 : 0);
      doorColR.layers.set(ease > 0.8 ? 1 : 0);

      return openAmount;
    }
  };
}
