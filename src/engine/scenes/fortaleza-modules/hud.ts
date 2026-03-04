export function createHUD(container: HTMLElement) {
  // Estilos CSS dinámicos para botones más atractivos
  const style = document.createElement('style');
  style.innerHTML = `
    .btn-volver {
        background: rgba(0, 229, 255, 0.1);
        border: 1px solid rgba(0, 229, 255, 0.4);
        border-radius: 30px;
        color: #00e5ff;
        padding: 12px 30px;
        font-size: 16px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 0 15px rgba(0, 229, 255, 0.1);
        backdrop-filter: blur(4px);
    }
    .btn-volver:hover {
        background: rgba(0, 229, 255, 0.3);
        box-shadow: 0 0 25px rgba(0, 229, 255, 0.4);
        transform: scale(1.05);
        color: #ffffff;
    }
  `;
  document.head.appendChild(style);

  // Menú de pausa
  const menuPausa = document.createElement('div');
  Object.assign(menuPausa.style, {
    position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
    backgroundColor: 'rgba(2, 6, 12, 0.70)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center', color: '#e6f3ff', fontFamily: 'system-ui, -apple-system, sans-serif', zIndex: '100',
    transition: 'opacity 0.3s ease'
  });
  menuPausa.innerHTML = `
    <h1 style="font-size: 72px; text-shadow: 0 0 30px rgba(0,229,255,0.4); color: #ffffff; margin-bottom: 5px; font-weight: 800; letter-spacing: 8px;">FORTALEZA OLVIDADA</h1>
    <h2 style="font-size: 20px; color: #00e5ff; letter-spacing: 4px; font-weight: 400; margin-bottom: 50px; text-transform: uppercase; animation: pulse 2s infinite;">— Haz clic para reanudar —</h2>
    <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); padding: 35px 45px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); text-align: left; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <p style="font-size: 16px; margin: 12px 0; color: #aaddff;"><strong style="color: #00e5ff; width: 110px; display: inline-block;">W A S D</strong> Moverse</p>
        <p style="font-size: 16px; margin: 12px 0; color: #aaddff;"><strong style="color: #00e5ff; width: 110px; display: inline-block;">ESPACIO</strong> Saltar / Doble Salto</p>
        <p style="font-size: 16px; margin: 12px 0; color: #aaddff;"><strong style="color: #00e5ff; width: 110px; display: inline-block;">SHIFT</strong> Correr</p>
        <p style="font-size: 16px; margin: 12px 0; color: #aaddff;"><strong style="color: #00e5ff; width: 110px; display: inline-block;">E</strong> Interactuar</p>
    </div>
    <div style="margin-top: 50px;"></div>
  `;
  const returnBtn = document.createElement('button');
  returnBtn.className = 'btn-volver';
  returnBtn.textContent = 'Salir al Menú';
  returnBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if ((window as any).returnToMenu) (window as any).returnToMenu();
  });
  menuPausa.appendChild(returnBtn);
  container.appendChild(menuPausa);

  // Contenedor modular del HUD (arriba a la izquierda)
  const hudContainer = document.createElement('div');
  Object.assign(hudContainer.style, {
    position: 'absolute', top: '30px', left: '30px',
    display: 'flex', flexDirection: 'column', gap: '15px', zIndex: '50',
    pointerEvents: 'none'
  });
  container.appendChild(hudContainer);

  const orbsPanel = document.createElement('div');
  Object.assign(orbsPanel.style, {
    background: 'rgba(10, 20, 30, 0.6)', backdropFilter: 'blur(6px)', border: '1px solid rgba(0, 229, 255, 0.3)',
    padding: '12px 20px', borderRadius: '12px', color: '#00e5ff',
    fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '22px', fontWeight: 'bold',
    textShadow: '0 0 10px rgba(0, 229, 255, 0.5)', display: 'flex', alignItems: 'center', gap: '10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)', pointerEvents: 'none', transition: 'transform 0.2s', transformOrigin: 'left center'
  });
  orbsPanel.innerHTML = '<div style="width: 16px; height: 16px; border-radius: 50%; background: #00e5ff; box-shadow: 0 0 10px #00e5ff;"></div> <span id="orb-count">0 / 4</span>';
  hudContainer.appendChild(orbsPanel);

  const doorHint = document.createElement('div');
  Object.assign(doorHint.style, {
    background: 'rgba(40, 30, 20, 0.6)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255, 208, 128, 0.3)',
    padding: '8px 16px', borderRadius: '8px', color: '#ffd080',
    fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '15px', fontWeight: '500',
    display: 'none', transition: 'all 0.3s ease', opacity: '0', pointerEvents: 'none',
    transform: 'translateY(10px)'
  });
  doorHint.textContent = 'Puerta: cerrada (E)';
  hudContainer.appendChild(doorHint);

  const jumpHint = document.createElement('div');
  Object.assign(jumpHint.style, {
    background: 'rgba(10, 30, 15, 0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0, 255, 128, 0.4)',
    padding: '12px 24px', borderRadius: '30px', color: '#00ff80',
    fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px',
    boxShadow: '0 0 20px rgba(0, 255, 128, 0.2)',
    opacity: '0', pointerEvents: 'none', transform: 'translateY(-20px)', transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  });
  jumpHint.textContent = 'DOBLE SALTO DESBLOQUEADO';
  hudContainer.appendChild(jumpHint);

  // Crosshair (centro de la pantalla)
  const crosshair = document.createElement('div');
  Object.assign(crosshair.style, {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    width: '20px', height: '20px', pointerEvents: 'none', zIndex: '50'
  });
  crosshair.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="0" x2="10" y2="7" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
    <line x1="10" y1="13" x2="10" y2="20" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
    <line x1="0" y1="10" x2="7" y2="10" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
    <line x1="13" y1="10" x2="20" y2="10" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
    <circle cx="10" cy="10" r="1.5" fill="rgba(0,229,255,0.9)"/>
  </svg>`;
  container.appendChild(crosshair);

  // Efecto Pantalla Fade Out (muerte / respawn)
  const fadeScreen = document.createElement('div');
  Object.assign(fadeScreen.style, {
    position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
    background: 'radial-gradient(circle, transparent 40%, rgba(200, 0, 0, 0.4) 80%, rgba(150, 0, 0, 0.8) 100%)',
    opacity: '0', pointerEvents: 'none',
    transition: 'opacity 0.15s ease-in, opacity 0.5s ease-out', zIndex: '200'
  });
  container.appendChild(fadeScreen);


  // Viñeta inmersiva
  const vignette = document.createElement('div');
  Object.assign(vignette.style, {
    position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '10',
    boxShadow: 'inset 0 0 250px rgba(0,10,20,1)'
  });
  container.appendChild(vignette);

  // Banner de Cambio de Zona (Estilo Dark Souls)
  const areaBanner = document.createElement('div');
  Object.assign(areaBanner.style, {
    position: 'absolute', top: '35%', left: '0', width: '100%',
    textAlign: 'center', pointerEvents: 'none', zIndex: '40',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    opacity: '0', transition: 'opacity 2.0s ease',
    textShadow: '0 0 20px rgba(0, 150, 255, 0.8)'
  });
  const areaTitle = document.createElement('h1');
  Object.assign(areaTitle.style, {
    color: '#e6f3ff', fontSize: '64px', fontWeight: '300', letterSpacing: '12px',
    fontFamily: 'Georgia, serif', margin: '0', textTransform: 'uppercase'
  });
  const areaSub = document.createElement('div');
  Object.assign(areaSub.style, {
    width: '500px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.8), transparent)',
    marginTop: '20px'
  });
  areaBanner.appendChild(areaTitle);
  areaBanner.appendChild(areaSub);
  container.appendChild(areaBanner);

  // Panel Lore
  const lorePanel = document.createElement('div');
  Object.assign(lorePanel.style, {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(0.95)',
    backgroundColor: 'rgba(6, 12, 18, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0, 170, 255, 0.2)',
    padding: '50px 60px', borderRadius: '12px', color: '#e6f3ff',
    fontFamily: 'Georgia, serif', width: '80%', maxWidth: '700px', textAlign: 'center',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)', display: 'none', zIndex: '60',
    opacity: '0', transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.1, 0.9, 0.2, 1)'
  });
  lorePanel.innerHTML = `
    <h2 id="lore-title" style="color: #ffffff; margin-top: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 6px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 25px;"></h2>
    <p id="lore-text" style="font-size: 22px; line-height: 1.6; color: rgba(255,255,255,0.85); font-style: italic; margin: 40px 0;"></p>
    <div style="margin-top: 50px;">
       <span style="font-family: system-ui; font-size: 12px; font-weight: bold; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 8px 20px; border-radius: 30px; color: #88aacc; letter-spacing: 2px;">CERRAR [ C ]</span>
    </div>
  `;
  container.appendChild(lorePanel);

  // Pantalla de Carga Global Bloqueante
  const loadingScreen = document.createElement('div');
  Object.assign(loadingScreen.style, {
    position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
    backgroundColor: '#050a14', zIndex: '10000', display: 'flex',
    flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    color: '#00e5ff', fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'opacity 0.8s ease'
  });

  loadingScreen.innerHTML = `
    <div style="font-size: 24px; font-weight: 300; letter-spacing: 6px; margin-bottom: 30px;">VIAJANDO A LA FORTALEZA</div>
    <div style="width: 300px; height: 4px; background: rgba(0, 229, 255, 0.1); border-radius: 2px; overflow: hidden; position: relative;">
       <div id="loading-bar" style="width: 0%; height: 100%; background: #00e5ff; box-shadow: 0 0 10px #00e5ff; transition: width 0.2s ease;"></div>
    </div>
    <div id="loading-text" style="margin-top: 15px; font-size: 14px; color: #6688aa; font-family: monospace;">Iniciando ritual... 0%</div>
  `;
  container.appendChild(loadingScreen);

  let loreTimer: any;

  return {
    menuPausa,
    fadeScreen,
    updateOrbs: (current: number, total: number) => {
      const countSpan = document.getElementById('orb-count');
      if (countSpan) countSpan.innerText = `${current} / ${total}`;
      orbsPanel.style.transform = 'scale(1.1)';
      setTimeout(() => { if (orbsPanel) orbsPanel.style.transform = 'scale(1)'; }, 200);
    },
    updateDoorStatus: (text: string, inRange: boolean) => {
      doorHint.textContent = text;
      if (inRange) {
        doorHint.style.display = 'block';
        void doorHint.offsetWidth;
        doorHint.style.opacity = '1';
        doorHint.style.transform = 'translateY(0)';
      } else {
        doorHint.style.opacity = '0';
        doorHint.style.transform = 'translateY(10px)';
      }
    },
    updateHighJump: (available: boolean, isTriple: boolean = false) => {
      jumpHint.textContent = isTriple ? 'TRIPLE SALTO ACTIVADO' : 'DOBLE SALTO ACTIVADO';

      if (available) {
        jumpHint.style.opacity = '1';
        jumpHint.style.transform = 'translateY(0px)';
      } else {
        jumpHint.style.opacity = '0';
        jumpHint.style.transform = 'translateY(-20px)';
      }

      if (isTriple) {
        jumpHint.style.border = '1px solid rgba(255, 0, 255, 0.4)';
        jumpHint.style.color = '#ff80ff';
        jumpHint.style.boxShadow = '0 0 20px rgba(255,0,255,0.2)';
      }
    },
    showAreaBanner: (title: string) => {
      areaTitle.textContent = title;
      areaBanner.style.opacity = '1';
      setTimeout(() => { areaBanner.style.opacity = '0'; }, 4500);
    },
    showLore: (title: string, text: string) => {
      (document.getElementById('lore-title') as HTMLElement).innerText = title;
      (document.getElementById('lore-text') as HTMLElement).innerText = text;
      lorePanel.style.display = 'block';
      // Permite renderizado antes de aplicar la transicion de opacidad y escala
      requestAnimationFrame(() => {
        lorePanel.style.opacity = '1';
        lorePanel.style.transform = 'translate(-50%, -50%) scale(1)';
      });

      clearTimeout(loreTimer);
      loreTimer = setTimeout(() => {
        lorePanel.style.opacity = '0';
        lorePanel.style.transform = 'translate(-50%, -50%) scale(0.95)';
        setTimeout(() => lorePanel.style.display = 'none', 500);
      }, 7000);
    },
    hideLore: () => {
      lorePanel.style.opacity = '0';
      lorePanel.style.transform = 'translate(-50%, -50%) scale(0.95)';
      setTimeout(() => lorePanel.style.display = 'none', 500);
      clearTimeout(loreTimer);
    },
    isLoreVisible: () => lorePanel.style.opacity === '1',
    updateLoadingProgress: (progress: number, itemUrl: string) => {
      const bar = document.getElementById('loading-bar');
      const text = document.getElementById('loading-text');
      if (bar) bar.style.width = `${progress}%`;
      if (text) {
        const shortName = itemUrl.split('/').pop() || 'recursos';
        text.innerText = `Invocando ${shortName}... ${Math.floor(progress)}%`;
      }
    },
    hideLoadingScreen: () => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.style.display = 'none', 800);
    },
    elements: [menuPausa, hudContainer, crosshair, fadeScreen, lorePanel, loadingScreen] // Exportamos todo para destruirlo fácilmente en el dispose()
  };
}
