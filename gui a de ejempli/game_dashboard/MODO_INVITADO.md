# Modo Invitado (Guest Mode) — React

**Guía para implementar el modo de prueba sin registro**  
**Framework**: React + TypeScript + Vite + Three.js  
**Última actualización**: 7 de Febrero 2026

---

## Modos de Juego

| Modo | Personajes | Disponible en Demo |
|------|-----------|-------------------|
| **RPG (Dungeons)** | **EQUIPO** (múltiples) | Tutorial Dungeon |
| **Survival** | **1 SOLO** personaje | 1 partida de prueba |

---

## Concepto

El **Modo Invitado** permite que nuevos usuarios prueben el juego **sin registrarse**, con limitaciones.

1. **Reducir fricción**: El jugador entra y juega inmediatamente
2. **Mostrar el valor**: Experimenta combate, personajes, dungeons
3. **Motivar conversión**: Al querer usar Marketplace/Shop, debe registrarse

### 100% Frontend (sin backend para invitados)

El modo invitado **NO hace llamadas autenticadas al backend**. Todo funciona con:
- **localStorage** para guardar estado temporal
- **Datos mock** hardcodeados en el frontend
- **Simulación local** de combate y dungeons

Solo cuando el usuario se registra, se conecta al backend real.

---

## Dos Tipos de Cuenta

| Aspecto | Cuenta Invitado | Cuenta Registrada |
|---------|-----------------|-------------------|
| **Creación** | 1 click (automática) | Email + contraseña |
| **Persistencia** | localStorage (temporal) | Backend + MongoDB |
| **Backend** | NO | SÍ (httpOnly cookie) |
| **Duración** | Hasta limpiar caché | Indefinida |
| **Identificador** | `guest_${uuid}` local | userId de MongoDB |

---

## Estructura de localStorage

```typescript
interface GuestData {
  id: string;              // "guest_abc123"
  createdAt: string;       // ISO date

  resources: {
    val: number;           // 100 inicial
    energy: number;        // 50/50
    maxEnergy: number;
  };

  // Para DUNGEONS (equipo completo)
  team: string[];          // ["demo_warrior", "demo_mage"]

  // Para SURVIVAL (1 solo personaje)
  survivalCharacter: string | null;

  progress: {
    tutorialCompleted: boolean;
    survivalTrialUsed: boolean;
    tutorialWins: number;
  };

  settings: {
    soundEnabled: boolean;
    musicVolume: number;
  };
}

const GUEST_STORAGE_KEY = 'valgame_guest';
```

---

## Zustand Store para Invitado

```tsx
// src/stores/useGuestStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEMO_CHARACTERS } from '../data/demo-data';

interface GuestState {
  id: string | null;
  isGuest: boolean;
  resources: { val: number; energy: number; maxEnergy: number };
  team: string[];
  survivalCharacter: string | null;
  progress: {
    tutorialCompleted: boolean;
    survivalTrialUsed: boolean;
    tutorialWins: number;
  };

  // Acciones
  createGuestSession: () => void;
  clearGuestData: () => void;
  addToTeam: (charId: string) => boolean;
  removeFromTeam: (charId: string) => void;
  selectSurvivalCharacter: (charId: string) => boolean;
  completeTutorial: () => void;
  useSurvivalTrial: () => boolean;
  spendEnergy: (amount: number) => boolean;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      id: null,
      isGuest: false,
      resources: { val: 100, energy: 50, maxEnergy: 50 },
      team: [],
      survivalCharacter: null,
      progress: {
        tutorialCompleted: false,
        survivalTrialUsed: false,
        tutorialWins: 0,
      },

      createGuestSession: () => {
        set({
          id: `guest_${crypto.randomUUID().slice(0, 8)}`,
          isGuest: true,
          resources: { val: 100, energy: 50, maxEnergy: 50 },
          team: [],
          survivalCharacter: null,
          progress: { tutorialCompleted: false, survivalTrialUsed: false, tutorialWins: 0 },
        });
      },

      clearGuestData: () => {
        set({ id: null, isGuest: false, team: [], survivalCharacter: null });
      },

      addToTeam: (charId) => {
        const { team } = get();
        if (team.length >= 4 || team.includes(charId)) return false;
        set({ team: [...team, charId] });
        return true;
      },

      removeFromTeam: (charId) => {
        set({ team: get().team.filter(id => id !== charId) });
      },

      selectSurvivalCharacter: (charId) => {
        if (!DEMO_CHARACTERS.some(c => c._id === charId)) return false;
        set({ survivalCharacter: charId });
        return true;
      },

      completeTutorial: () => {
        set(s => ({
          progress: { ...s.progress, tutorialCompleted: true, tutorialWins: s.progress.tutorialWins + 1 }
        }));
      },

      useSurvivalTrial: () => {
        if (get().progress.survivalTrialUsed) return false;
        set(s => ({ progress: { ...s.progress, survivalTrialUsed: true } }));
        return true;
      },

      spendEnergy: (amount) => {
        const { resources } = get();
        if (resources.energy < amount) return false;
        set({ resources: { ...resources, energy: resources.energy - amount } });
        return true;
      },
    }),
    { name: 'valgame_guest' }
  )
);
```

---

## Datos Mock (Frontend Only)

```tsx
// src/data/demo-data.ts

export const DEMO_CHARACTERS = [
  {
    _id: 'demo_warrior',
    nombre: 'Guerrero', clase: 'Guerrero', rango: 'Bronce',
    nivel: 5, etapa: 1,
    stats: { salud: 150, saludMaxima: 150, ataque: 25, defensa: 20, velocidad: 10, critico: 5 },
    habilidades: [
      { id: 'slash', nombre: 'Tajo', daño: 30, costo: 0 },
      { id: 'shield', nombre: 'Escudo', defensa: 15, costo: 10 },
    ],
    avatar: '/assets/demo/warrior.png',
  },
  {
    _id: 'demo_mage',
    nombre: 'Mago', clase: 'Mago', rango: 'Bronce',
    nivel: 5, etapa: 1,
    stats: { salud: 80, saludMaxima: 80, ataque: 40, defensa: 10, velocidad: 15, critico: 10 },
    habilidades: [
      { id: 'fireball', nombre: 'Bola de Fuego', daño: 45, costo: 15 },
      { id: 'heal', nombre: 'Curar', heal: 30, costo: 20 },
    ],
    avatar: '/assets/demo/mage.png',
  },
  {
    _id: 'demo_archer',
    nombre: 'Arquero', clase: 'Arquero', rango: 'Bronce',
    nivel: 5, etapa: 1,
    stats: { salud: 100, saludMaxima: 100, ataque: 30, defensa: 12, velocidad: 25, critico: 15 },
    habilidades: [
      { id: 'arrow', nombre: 'Flecha', daño: 35, costo: 0 },
      { id: 'multishot', nombre: 'Ráfaga', daño: 20, hits: 3, costo: 15 },
    ],
    avatar: '/assets/demo/archer.png',
  },
  {
    _id: 'demo_tank',
    nombre: 'Tanque', clase: 'Paladín', rango: 'Bronce',
    nivel: 5, etapa: 1,
    stats: { salud: 200, saludMaxima: 200, ataque: 15, defensa: 35, velocidad: 5, critico: 2 },
    habilidades: [
      { id: 'bash', nombre: 'Golpe', daño: 20, costo: 0 },
      { id: 'taunt', nombre: 'Provocar', efecto: 'aggro', costo: 10 },
    ],
    avatar: '/assets/demo/tank.png',
  },
];

export const DEMO_ENEMIES = [
  { id: 'slime', nombre: 'Slime', nivel: 1, stats: { salud: 30, ataque: 5, defensa: 2 } },
  { id: 'goblin', nombre: 'Goblin', nivel: 2, stats: { salud: 50, ataque: 10, defensa: 5 } },
  { id: 'orc', nombre: 'Orco', nivel: 3, stats: { salud: 80, ataque: 15, defensa: 10 } },
  { id: 'boss_troll', nombre: 'Troll (Boss)', nivel: 5, stats: { salud: 150, ataque: 25, defensa: 15 }, isBoss: true },
];

export const TUTORIAL_DUNGEON = {
  id: 'tutorial',
  nombre: 'Cueva de Entrenamiento',
  niveles: [
    { nivel: 1, enemigos: ['slime', 'slime'], mensaje: '¡Usa ATACAR para golpear!' },
    { nivel: 2, enemigos: ['goblin'], mensaje: 'Prueba usar una HABILIDAD' },
    { nivel: 3, enemigos: ['orc', 'goblin'], mensaje: '¡Combate múltiple!' },
    { nivel: 4, enemigos: ['boss_troll'], mensaje: '¡BOSS FINAL!', isBoss: true },
  ],
  recompensaDemo: { val: 50, exp: 100, mensaje: '¡En el juego real ganarías recompensas de verdad!' },
};

export const SURVIVAL_TRIAL = {
  id: 'survival_trial',
  nombre: 'Supervivencia (Prueba)',
  maxOleadas: 5,
  oleadas: [
    { oleada: 1, enemigos: ['slime', 'slime', 'slime'] },
    { oleada: 2, enemigos: ['goblin', 'goblin'] },
    { oleada: 3, enemigos: ['orc', 'goblin', 'slime'] },
    { oleada: 4, enemigos: ['orc', 'orc'] },
    { oleada: 5, enemigos: ['boss_troll'], isBoss: true },
  ],
};
```

---

## Simulador de Combate Local (Hook)

```tsx
// src/hooks/useCombatSimulator.ts
import { useState, useCallback } from 'react';
import { DEMO_ENEMIES } from '../data/demo-data';

interface EnemyState {
  id: string; nombre: string; hp: number; maxHp: number; ataque: number;
}

interface CombatState {
  turno: number;
  jugadorHP: number;
  jugadorMaxHP: number;
  enemigos: EnemyState[];
  log: string[];
  estado: 'activo' | 'victoria' | 'derrota';
}

export function useCombatSimulator() {
  const [state, setState] = useState<CombatState | null>(null);

  const startCombat = useCallback((playerHP: number, enemyIds: string[]) => {
    const enemigos = enemyIds.map(id => {
      const t = DEMO_ENEMIES.find(e => e.id === id)!;
      return { id: t.id, nombre: t.nombre, hp: t.stats.salud, maxHp: t.stats.salud, ataque: t.stats.ataque };
    });
    setState({
      turno: 1, jugadorHP: playerHP, jugadorMaxHP: playerHP,
      enemigos, log: ['¡Combate iniciado!'], estado: 'activo',
    });
  }, []);

  const attack = useCallback((targetIndex: number, damage: number) => {
    setState(prev => {
      if (!prev || prev.estado !== 'activo') return prev;
      const enemigos = prev.enemigos.map((e, i) => {
        if (i !== targetIndex || e.hp <= 0) return e;
        const actualDmg = Math.floor(damage * (0.9 + Math.random() * 0.2));
        return { ...e, hp: Math.max(0, e.hp - actualDmg) };
      });
      const log = [...prev.log];
      const target = enemigos[targetIndex];
      log.push(`¡Atacas a ${target.nombre} por ${damage} de daño!`);
      if (target.hp <= 0) log.push(`💀 ${target.nombre} derrotado!`);

      // Check victory
      if (enemigos.every(e => e.hp <= 0)) {
        return { ...prev, enemigos, log: [...log, '🎉 ¡VICTORIA!'], estado: 'victoria' as const };
      }

      // Enemy turn
      let hp = prev.jugadorHP;
      for (const e of enemigos) {
        if (e.hp <= 0) continue;
        const dmg = Math.floor(e.ataque * (0.8 + Math.random() * 0.4));
        hp = Math.max(0, hp - dmg);
        log.push(`${e.nombre} te ataca por ${dmg} de daño!`);
      }

      if (hp <= 0) {
        return { ...prev, jugadorHP: 0, enemigos, log: [...log, '💀 Has sido derrotado...'], estado: 'derrota' as const, turno: prev.turno + 1 };
      }

      return { ...prev, jugadorHP: hp, enemigos, log, turno: prev.turno + 1 };
    });
  }, []);

  const defend = useCallback(() => {
    setState(prev => {
      if (!prev || prev.estado !== 'activo') return prev;
      const log = [...prev.log, '🛡️ Te preparas para defender (daño reducido 50%)'];
      let hp = prev.jugadorHP;
      for (const e of prev.enemigos) {
        if (e.hp <= 0) continue;
        const dmg = Math.floor(e.ataque * 0.5 * (0.8 + Math.random() * 0.4));
        hp = Math.max(0, hp - dmg);
        log.push(`${e.nombre} te ataca por ${dmg} de daño (defendido)`);
      }
      if (hp <= 0) {
        return { ...prev, jugadorHP: 0, log: [...log, '💀 Has sido derrotado...'], estado: 'derrota' as const };
      }
      return { ...prev, jugadorHP: hp, log, turno: prev.turno + 1 };
    });
  }, []);

  const reset = useCallback(() => setState(null), []);

  return { state, startCombat, attack, defend, reset };
}
```

---

## Funcionalidades por Tipo de Cuenta

### Lo que PUEDE hacer un invitado (100% local):

| Funcionalidad | Cómo funciona |
|---------------|---------------|
| Ver Dashboard | Datos mock locales |
| Ver personajes demo | `DEMO_CHARACTERS` hardcodeado |
| Armar equipo | Zustand store (persistido en localStorage) |
| Tutorial Dungeon | `useCombatSimulator` local |
| Survival (1 vez) | Simulación local, se marca como usada |
| Ver Rankings | `GET /api/rankings` (público, sin auth) |
| Ver Tienda (catálogo) | `GET /api/shop/packages` (público) |
| Ver Marketplace | `GET /api/marketplace/history` (público) |

### Lo que NO puede hacer (requiere registro):

| Funcionalidad | Qué mostrar |
|---------------|-------------|
| Comprar en Tienda | Modal "Regístrate para comprar" |
| Vender en Marketplace | Modal "Crea cuenta para vender" |
| Comprar en Marketplace | Modal "Regístrate para comprar" |
| Guardar progreso real | Banner "Progreso temporal" |
| Dungeons reales | "Solo tutorial disponible" |
| Survival ilimitado | "Ya usaste tu partida de prueba" |
| Aparecer en Rankings | "Regístrate para competir" |
| Chat global | "Crea cuenta para chatear" |

---

## Componentes React

### Banner de Invitado

```tsx
// src/components/ui/GuestBanner.tsx
import { useGuestStore } from '../../stores/useGuestStore';
import { useNavigate } from 'react-router-dom';

export const GuestBanner: React.FC = () => {
  const { isGuest } = useGuestStore();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!isGuest || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 flex items-center justify-center gap-4 z-50">
      <span>Modo Invitado — Tu progreso es temporal</span>
      <button
        onClick={() => navigate('/register')}
        className="bg-white text-red-500 px-3 py-1 rounded font-bold text-sm"
      >
        Crear Cuenta Gratis
      </button>
      <button onClick={() => setDismissed(true)} className="text-white opacity-80">✕</button>
    </div>
  );
};
```

### Modal de Feature Bloqueada

```tsx
// src/components/ui/FeatureLockedModal.tsx
import { useNavigate } from 'react-router-dom';

interface Props {
  title?: string;
  message?: string;
  onClose: () => void;
}

export const FeatureLockedModal: React.FC<Props> = ({
  title = 'Función Bloqueada',
  message = 'Necesitas una cuenta para usar esta función',
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md" onClick={e => e.stopPropagation()}>
        <div className="text-5xl text-center mb-4">🔒</div>
        <h2 className="text-xl font-bold text-center mb-2">{title}</h2>
        <p className="text-gray-400 text-center mb-4">{message}</p>

        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <h4 className="font-bold mb-2">Al registrarte obtienes:</h4>
          <ul className="space-y-1 text-sm">
            <li>✅ Acceso completo al Marketplace</li>
            <li>✅ Comprar paquetes y items</li>
            <li>✅ Guardar tu progreso</li>
            <li>✅ 500 VAL de bienvenida</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { navigate('/register'); onClose(); }}
            className="flex-1 bg-yellow-500 text-black font-bold py-2 rounded-lg"
          >
            Crear Cuenta Gratis
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-700 py-2 rounded-lg">
            Seguir como invitado
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Componente de Combate Demo

```tsx
// src/components/combat/DemoCombat.tsx
import { useCombatSimulator } from '../../hooks/useCombatSimulator';
import { useNavigate } from 'react-router-dom';

export const DemoCombat: React.FC<{ playerHP: number; playerATK: number; enemyIds: string[] }> = ({
  playerHP, playerATK, enemyIds,
}) => {
  const { state, startCombat, attack, defend, reset } = useCombatSimulator();
  const navigate = useNavigate();
  const [selectedTarget, setSelectedTarget] = useState(0);

  useEffect(() => {
    startCombat(playerHP, enemyIds);
  }, []);

  if (!state) return <div>Cargando...</div>;

  return (
    <div className="combat-arena p-4">
      {/* HP Bar */}
      <div className="mb-4">
        <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all"
            style={{ width: `${(state.jugadorHP / state.jugadorMaxHP) * 100}%` }}
          />
        </div>
        <span className="text-sm">{state.jugadorHP} / {state.jugadorMaxHP}</span>
      </div>

      {/* Enemies */}
      <div className="flex gap-4 mb-4">
        {state.enemigos.map((enemy, i) => (
          <div
            key={enemy.id}
            className={`p-3 rounded-xl cursor-pointer border-2 ${
              enemy.hp <= 0 ? 'opacity-30' : selectedTarget === i ? 'border-yellow-500' : 'border-gray-600'
            }`}
            onClick={() => setSelectedTarget(i)}
          >
            <span className="font-bold">{enemy.nombre}</span>
            <div className="bg-gray-700 rounded-full h-2 mt-1">
              <div className="bg-red-500 h-full" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
            </div>
            <span className="text-xs">{enemy.hp}/{enemy.maxHp}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {state.estado === 'activo' && (
        <div className="flex gap-3 mb-4">
          <button onClick={() => attack(selectedTarget, playerATK)} className="bg-red-600 px-4 py-2 rounded-lg">
            ⚔️ Atacar
          </button>
          <button onClick={defend} className="bg-blue-600 px-4 py-2 rounded-lg">
            🛡️ Defender
          </button>
        </div>
      )}

      {/* Result */}
      {state.estado !== 'activo' && (
        <div className="text-center p-6 bg-gray-800 rounded-xl">
          <h2 className="text-2xl font-bold mb-2">
            {state.estado === 'victoria' ? '🎉 ¡VICTORIA!' : '💀 Derrota'}
          </h2>
          {state.estado === 'victoria' && (
            <p className="text-gray-400 mb-4">
              En el juego completo ganarías recompensas reales.<br />
              <strong>¡Regístrate para jugar de verdad!</strong>
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/dashboard')} className="bg-gray-700 px-4 py-2 rounded-lg">
              Volver
            </button>
            <button onClick={() => navigate('/register')} className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg">
              Crear Cuenta
            </button>
          </div>
        </div>
      )}

      {/* Combat Log */}
      <div className="mt-4 bg-gray-900 rounded-xl p-3 max-h-32 overflow-y-auto text-sm text-gray-300">
        {state.log.slice(-5).map((entry, i) => (
          <p key={i}>{entry}</p>
        ))}
      </div>
    </div>
  );
};
```

---

## Route Guards (React)

```tsx
// src/components/guards/RegisteredOnlyRoute.tsx
import { useAuth } from '../../hooks/useAuth';
import { useGuestStore } from '../../stores/useGuestStore';
import { FeatureLockedModal } from '../ui/FeatureLockedModal';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export const RegisteredOnlyRoute: React.FC<Props> = ({ children, fallbackMessage }) => {
  const { isAuthenticated } = useAuth();
  const { isGuest } = useGuestStore();
  const [showModal, setShowModal] = useState(!isAuthenticated || isGuest);

  if (isAuthenticated && !isGuest) {
    return <>{children}</>;
  }

  return (
    <>
      {showModal && (
        <FeatureLockedModal
          title="Acceso Restringido"
          message={fallbackMessage || 'Esta sección requiere una cuenta registrada'}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};
```

### Rutas con protección

```tsx
// src/App.tsx (fragmento de rutas)
<Routes>
  {/* Públicas (invitados pueden ver) */}
  <Route path="/" element={<Landing />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/ranking" element={<Ranking />} />
  <Route path="/shop" element={<Shop />} />            {/* Solo ver catálogo */}
  <Route path="/marketplace" element={<Marketplace />} /> {/* Solo ver listings */}

  {/* Auth */}
  <Route path="/login" element={<Auth />} />
  <Route path="/register" element={<Auth />} />

  {/* Solo registrados */}
  <Route path="/inventory" element={<RegisteredOnlyRoute><Inventory /></RegisteredOnlyRoute>} />
  <Route path="/dungeon" element={<RegisteredOnlyRoute><Dungeon /></RegisteredOnlyRoute>} />
  <Route path="/survival" element={<RegisteredOnlyRoute><Survival /></RegisteredOnlyRoute>} />
  <Route path="/profile" element={<RegisteredOnlyRoute><Profile /></RegisteredOnlyRoute>} />
  <Route path="/settings" element={<RegisteredOnlyRoute><Settings /></RegisteredOnlyRoute>} />
</Routes>
```

---

## AuthContext con soporte Guest

```tsx
// src/context/AuthContext.tsx — Fragmento relevante
// El AuthContext ya existente debe poder detectar modo invitado

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { isGuest } = useGuestStore();

  return {
    ...context,
    isGuest,
    // Un usuario "logueado" puede ser guest o registrado
    isLoggedIn: context.isAuthenticated || isGuest,
  };
};
```

---

## Flujo de Conversión (Guest → Registrado)

```
[Landing Page]
      │
      ├── "JUGAR AHORA" → useGuestStore.createGuestSession()
      │                         │
      │                         ▼
      │                  [Dashboard Invitado]
      │                         │
      │        ┌────────────────┼────────────────┐
      │        ▼                ▼                ▼
      │   [Tutorial]      [Survival]        [Team Demo]
      │   Dungeon         Trial (1x)        (local)
      │        │                │                │
      │        └────────────────┼────────────────┘
      │                         │
      │                         ▼
      │               Feature bloqueada
      │              (Marketplace, Shop, etc.)
      │                         │
      │                         ▼
      │              [FeatureLockedModal]
      │                         │
      │           ┌─────────────┴──────────────┐
      │           ▼                            ▼
      │   [Seguir invitado]           [Ir a Registro]
      │                                        │
      │                                        ▼
      │                             POST /auth/register
      │                             (⚠️ SIN /api prefix)
      │                                        │
      │                                        ▼
      │                           [Cuenta Creada]
      │                           + 500 VAL bienvenida
      │                           + Paquete Pionero
      │                           + useGuestStore.clearGuestData()
      │                                        │
      │                                        ▼
      │                           [Dashboard Completo]
      │                           (todas las funciones)
```

**Endpoints de registro (corregidos):**
```
POST /auth/register    ← SIN prefijo /api
POST /auth/login       ← SIN prefijo /api
```

---

## UI/UX Wireframes

### Pantalla de Entrada (Landing)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                         VALGAME                                │
│                    "El RPG que te atrapará"                    │
│                                                                │
│         ┌──────────────────────────────────────────┐           │
│         │    ⚡ JUGAR AHORA (sin registro)         │           │
│         └──────────────────────────────────────────┘           │
│                                                                │
│                           ─── o ───                            │
│                                                                │
│         ┌────────────────┐    ┌────────────────┐               │
│         │   📧 Registro  │    │   🔑 Login     │               │
│         └────────────────┘    └────────────────┘               │
│                                                                │
│              "El progreso de invitado es temporal"             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Dashboard de Invitado

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️ MODO INVITADO - Tu progreso es temporal  [Crear Cuenta]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  JUGAR   │ │ TIENDA   │ │MARKETPLACE│ │ EQUIPOS  │          │
│  │   ⚔️     │ │   🔒     │ │    🔒     │ │   👥     │          │
│  │ Tutorial │ │ Solo ver │ │  Solo ver │ │  Demo    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                │
│  ┌───────────────────────┐ ┌────────────────────────┐          │
│  │ EQUIPO DEMO           │ │ TU PROGRESO (DEMO)     │          │
│  │ [Guerrero][Mago][Arqu]│ │ Partidas: 0 | Nivel: 1 │          │
│  │ Personajes de prueba  │ │ ⚠️ No se guardará      │          │
│  └───────────────────────┘ └────────────────────────┘          │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🎁 REGÍSTRATE Y OBTÉN:                                  │  │
│  │  • 500 VAL de bienvenida                                 │  │
│  │  • 1 Paquete Pionero GRATIS                              │  │
│  │  • Guarda tu progreso para siempre                       │  │
│  │                [CREAR CUENTA GRATIS]                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Comparativa Visual: Invitado vs Registrado

| Aspecto | Invitado | Registrado |
|---------|----------|------------|
| Header | `[Logo] [⚠️ Demo] [Registrarse]` | `[Logo] [💰500] [🔔(3)] [👤]` |
| Cards | Play ✓, Shop 🔒, Market 🔒, Team ✓ | Todas ✓ |
| Equipo | 4 personajes demo | Tus personajes reales |
| Progreso | localStorage (temporal) | MongoDB (permanente) |
| VAL | 100 (demo, no real) | Balance real |

---

## Checklist de Implementación

### Archivos a crear (React)

**Stores:**
- [ ] `src/stores/useGuestStore.ts` — Estado del invitado (Zustand + persist)

**Hooks:**
- [ ] `src/hooks/useCombatSimulator.ts` — Combate local sin backend

**Data:**
- [ ] `src/data/demo-data.ts` — Personajes, enemigos, dungeons demo

**Componentes:**
- [ ] `src/components/ui/GuestBanner.tsx` — Banner sticky "Modo Invitado"
- [ ] `src/components/ui/FeatureLockedModal.tsx` — Modal cuando intenta algo bloqueado
- [ ] `src/components/combat/DemoCombat.tsx` — Combate local
- [ ] `src/components/guards/RegisteredOnlyRoute.tsx` — Guard de rutas

**Assets:**
- [ ] `/public/assets/demo/` — Avatares de personajes y enemigos demo

### Integración con código existente
- [ ] Actualizar `AuthContext.tsx` para detectar guest
- [ ] Actualizar `Landing.tsx` con botón "Jugar Ahora"
- [ ] Actualizar `Dashboard.tsx` para layout adaptativo (guest vs registrado)
- [ ] Actualizar `App.tsx` rutas con `RegisteredOnlyRoute` guards

---

## Resumen Rápido

| Concepto | Implementación React |
|----------|---------------------|
| Estado invitado | `useGuestStore` (Zustand + persist) |
| Datos mock | `src/data/demo-data.ts` |
| Combate local | `useCombatSimulator` hook |
| Banner | `GuestBanner` componente |
| Bloqueo features | `FeatureLockedModal` + `RegisteredOnlyRoute` |
| Auth rutas | `/auth/register`, `/auth/login` (SIN `/api`) |
| Conversión | `clearGuestData()` al registrarse |

---

**Referencia:** Ver `AUTH_AND_FLOWS.md` para el flujo de registro/login.
