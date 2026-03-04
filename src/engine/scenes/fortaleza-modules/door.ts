import * as THREE from 'three';

export function createDoor(scene: THREE.Scene, collidables: THREE.Object3D[]) {
  function makeWoodTexture() {
    const w = 512, h = 1024;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d')!;

    // Base: roble oscuro envejecido
    ctx.fillStyle = '#2a1810'; ctx.fillRect(0, 0, w, h);

    // Capa de variación cálida oscura
    for (let y = 0; y < h; y += 2) {
      const shade = Math.random() * 15;
      ctx.fillStyle = `rgba(${40 + shade}, ${20 + shade * 0.5}, ${12 + shade * 0.3}, 0.3)`;
      ctx.fillRect(0, y, w, 2);
    }

    // Tablones verticales con juntas anchas
    const plankWidth = w / 5;
    for (let p = 0; p < 5; p++) {
      const px = p * plankWidth;
      // Junta entre tablones (ranura profunda)
      ctx.fillStyle = '#0a0604';
      ctx.fillRect(px - 1, 0, 3, h);
      // Variación de tono por tablón
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 50 : 20}, ${Math.random() > 0.5 ? 25 : 10}, ${Math.random() > 0.5 ? 15 : 5}, 0.15)`;
      ctx.fillRect(px, 0, plankWidth, h);
    }

    // Vetas de madera profundas
    for (let x = 0; x < w; x += 3) {
      const stripeWidth = 1 + Math.floor(Math.random() * 2);
      const shade = Math.random() * 25;
      ctx.fillStyle = `rgba(${shade}, ${shade * 0.4}, ${shade * 0.2}, ${0.08 + Math.random() * 0.12})`;
      ctx.fillRect(x, 0, stripeWidth, h);
    }

    // Vetas horizontales onduladas (anillos de crecimiento)
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      let currX = 0; const currY = Math.random() * h;
      ctx.moveTo(currX, currY);
      while (currX < w) {
        currX += 20 + Math.random() * 30;
        ctx.lineTo(currX, currY + (Math.random() - 0.5) * 8);
      }
      ctx.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.15})`;
      ctx.lineWidth = 1 + Math.random();
      ctx.stroke();
    }

    // Nudos de madera oscuros (grandes, visibles)
    for (let i = 0; i < 6; i++) {
      const kx = Math.random() * w; const ky = Math.random() * h;
      const kr = 10 + Math.random() * 18;
      const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
      grad.addColorStop(0, 'rgba(15, 8, 3, 0.7)');
      grad.addColorStop(0.5, 'rgba(30, 15, 8, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse(kx, ky, kr, kr * 0.7, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill();
    }

    // Manchas de hierro oxidado (envejecimiento)
    for (let i = 0; i < 12; i++) {
      const sx = Math.random() * w; const sy = Math.random() * h;
      ctx.fillStyle = `rgba(${40 + Math.random() * 30}, ${10 + Math.random() * 10}, 0, ${0.1 + Math.random() * 0.15})`;
      ctx.beginPath(); ctx.ellipse(sx, sy, 15 + Math.random() * 25, 8 + Math.random() * 15, Math.random(), 0, Math.PI * 2); ctx.fill();
    }

    // Grietas y desgaste
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      let cx = Math.random() * w; let cy = Math.random() * h;
      ctx.moveTo(cx, cy);
      for (let j = 0; j < 6; j++) {
        cx += (Math.random() - 0.5) * 10;
        cy += 15 + Math.random() * 20;
        ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = `rgba(0,0,0,${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.stroke();
    }

    // Clavos/tachuelas grandes visibles (cabezas de hierro forjado)
    for (let y = 50; y < h; y += 90) {
      for (let x = 40; x < w; x += plankWidth) {
        const nx = x + (Math.random() - 0.5) * 10;
        const ny = y + (Math.random() - 0.5) * 15;
        // Sombra del clavo
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.arc(nx + 1, ny + 1, 4, 0, Math.PI * 2); ctx.fill();
        // Cabeza del clavo
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.arc(nx, ny, 3.5, 0, Math.PI * 2); ctx.fill();
        // Brillo metálico
        ctx.fillStyle = 'rgba(80,70,60,0.4)';
        ctx.beginPath(); ctx.arc(nx - 1, ny - 1, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    const colorTex = new THREE.CanvasTexture(c); colorTex.wrapS = colorTex.wrapT = THREE.RepeatWrapping; colorTex.repeat.set(1, 1);

    // Bump map más agresivo
    const cb = document.createElement('canvas'); cb.width = 256; cb.height = 256; const bctx = cb.getContext('2d')!;
    bctx.fillStyle = '#808080'; bctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 30000; i++) {
      const xx = Math.random() * cb.width; const yy = Math.random() * cb.height;
      const v = 100 + Math.floor(Math.random() * 100);
      bctx.fillStyle = `rgba(${v},${v},${v},${0.06 + Math.random() * 0.08})`; bctx.fillRect(xx, yy, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
    }
    // Añadir líneas verticales de veta al bump
    for (let x = 0; x < 256; x += 4) {
      bctx.fillStyle = `rgba(${60 + Math.random() * 40}, ${60 + Math.random() * 40}, ${60 + Math.random() * 40}, 0.15)`;
      bctx.fillRect(x, 0, 1, 256);
    }
    const bumpTex = new THREE.CanvasTexture(cb); bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping; bumpTex.repeat.set(2, 4);

    return { color: colorTex, bump: bumpTex };
  }

  const woodTex = makeWoodTexture();
  const doorMat2 = new THREE.MeshStandardMaterial({ map: woodTex.color, bumpMap: woodTex.bump, bumpScale: 0.12, roughness: 0.92, metalness: 0.02 });
  const metalBandMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', metalness: 0.95, roughness: 0.35, emissive: '#050505', emissiveIntensity: 0.1 });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#1a1510', roughness: 0.7, metalness: 0.3 });
  const handleMat = new THREE.MeshStandardMaterial({ color: '#8a6a44', metalness: 0.9, roughness: 0.3 });

  const doorGroup = new THREE.Group();
  const hingeOffsetX = 9; const panelW = 9; const panelH = 11.5; const panelDepth = 1.0;

  const leftHinge = new THREE.Group(); leftHinge.position.set(-hingeOffsetX, 0, 0); // Z será configurado en base a environment
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, panelDepth), doorMat2);
  leftPanel.position.set(panelW / 2, panelH / 2 - 0.05, 0); leftPanel.castShadow = true; leftHinge.add(leftPanel);
  leftHinge.userData = { panel: leftPanel, basePanelX: leftPanel.position.x };

  const bandL = new THREE.Mesh(new THREE.BoxGeometry(panelW + 0.4, 0.6, 0.5), metalBandMat); bandL.position.set(panelW / 2, 2.2, panelDepth / 2 + 0.02); leftHinge.add(bandL);
  const bandL2 = bandL.clone(); bandL2.position.y = panelH - 2.2; leftHinge.add(bandL2);
  const bandL3 = bandL.clone(); bandL3.position.y = panelH / 2; leftHinge.add(bandL3); // Banda central extra
  for (let y = 2.8; y < panelH; y += 2.2) { const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.22, 8), metalBandMat); stud.rotation.x = Math.PI / 2; stud.position.set(panelW - 0.6, y, panelDepth / 2 + 0.1); leftHinge.add(stud); }
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
  const bandR3 = bandL.clone(); bandR3.position.set(-panelW / 2, panelH / 2, panelDepth / 2 + 0.02); rightHinge.add(bandR3);
  for (let y = 2.8; y < panelH; y += 2.2) { const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.22, 8), metalBandMat); stud.rotation.x = Math.PI / 2; stud.position.set(-panelW + 0.6, y, panelDepth / 2 + 0.1); rightHinge.add(stud); }
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
  threshold.position.set(0, 0.05, 0); frameGroup.add(threshold); // Y=0.05 para no pelear con el piso

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
