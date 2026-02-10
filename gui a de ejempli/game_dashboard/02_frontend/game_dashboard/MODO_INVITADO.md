# 🎮 Modo Invitado (Guest Mode)

**Guía para implementar el modo de prueba sin registro**  
**Fecha**: Febrero 2026  
**Última actualización**: 2 de Febrero 2026

---

## ⚠️ IMPORTANTE: Modos de Juego

| Modo | Personajes | Disponible en Demo |
|------|-----------|-------------------|
| **RPG (Dungeons)** | **EQUIPO** (múltiples) | ✅ Tutorial Dungeon |
| **Survival** | **1 SOLO** personaje | ✅ 1 partida de prueba |

---

## 📋 Concepto

El **Modo Invitado** permite que nuevos usuarios prueben el juego **sin registrarse**, con funcionalidades limitadas. El objetivo es:

1. **Reducir fricción**: El jugador entra y juega inmediatamente
2. **Mostrar el valor**: Experimenta combate, personajes, dungeons
3. **Motivar conversión**: Al querer usar Marketplace/Shop, debe registrarse

### ⚡ IMPORTANTE: 100% Frontend

El modo invitado **NO hace llamadas al backend**. Todo funciona con:
- **localStorage** para guardar estado temporal
- **Datos mock** hardcodeados en el frontend
- **Simulación local** de combate y dungeons

Solo cuando el usuario se registra, se conecta al backend real.

---

## 🔐 Dos Tipos de Cuenta

| Aspecto | Cuenta Invitado | Cuenta Registrada |
|---------|-----------------|-------------------|
| **Creación** | 1 click (automática) | Email + contraseña |
| **Persistencia** | localStorage (temporal) | Backend + MongoDB |
| **Conexión al backend** | ❌ NO | ✅ SÍ |
| **Duración** | Hasta limpiar caché | Indefinida |
| **Identificador** | `guest_${uuid}` local | `userId` de MongoDB |

---

## 🗄️ Estructura de localStorage

```typescript
// Toda la data del invitado en localStorage

interface GuestData {
  id: string;              // "guest_abc123"
  createdAt: string;       // ISO date
  
  // Recursos (demo)
  resources: {
    val: number;           // 100 inicial
    energy: number;        // 50/50
    maxEnergy: number;
  };
  
  // Para DUNGEONS (usa equipo)
  team: string[];          // ["demo_warrior", "demo_mage"] - IDs de DEMO_CHARACTERS
  
  // Para SURVIVAL (1 solo personaje)
  survivalCharacter: string | null;  // "demo_warrior" - ID único
  
  // Progreso demo
  progress: {
    tutorialCompleted: boolean;
    survivalTrialUsed: boolean;
    tutorialWins: number;
  };
  
  // Configuración
  settings: {
    soundEnabled: boolean;
    musicVolume: number;
  };
}

// Clave en localStorage
const GUEST_STORAGE_KEY = 'valgame_guest';
```

---

## 📦 Servicio de Invitado (100% Local)

```typescript
// guest.service.ts - NO USA HTTP, TODO ES LOCAL

import { Injectable, signal, computed } from '@angular/core';
import { DEMO_CHARACTERS } from './demo-data';

const GUEST_STORAGE_KEY = 'valgame_guest';

export interface GuestData {
  id: string;
  createdAt: string;
  resources: { val: number; energy: number; maxEnergy: number };
  team: string[];
  progress: {
    tutorialCompleted: boolean;
    survivalTrialUsed: boolean;
    tutorialWins: number;
  };
}

// hooks/useGuest.ts
import { useState, useCallback, useMemo } from 'react';

const GUEST_STORAGE_KEY = 'valgame_guest';

export function useGuest() {
  const [guestData, setGuestData] = useState<GuestData | null>(() => {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  // Computed
  const isGuest = useMemo(() => guestData !== null, [guestData]);
  const resources = useMemo(() => guestData?.resources, [guestData]);
  const team = useMemo(() => guestData?.team || [], [guestData]);
  const progress = useMemo(() => guestData?.progress, [guestData]);
  const survivalCharacter = useMemo(() => guestData?.survivalCharacter, [guestData]);

  const saveToStorage = useCallback((data: GuestData) => {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
  }, []);

  // ═══════════════════════════════════════════════════════
  // CREAR SESIÓN DE INVITADO (todo local)
  // ═══════════════════════════════════════════════════════
  const createGuestSession = useCallback(() => {
    const newGuest: GuestData = {
      id: `guest_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      resources: {
        val: 100,      // VAL demo
        energy: 50,    // Energía inicial
        maxEnergy: 50
      },
      team: [],                     // Para DUNGEONS (equipo)
      survivalCharacter: null,      // Para SURVIVAL (1 personaje)
      progress: {
        tutorialCompleted: false,
        survivalTrialUsed: false,
        tutorialWins: 0
      }
    };
    
    saveToStorage(newGuest);
    setGuestData(newGuest);
  }, [saveToStorage]);

  // ═══════════════════════════════════════════════════════
  // EQUIPO PARA DUNGEONS (múltiples personajes)
  // ═══════════════════════════════════════════════════════
  const getTeamCharacters = useCallback(() => {
    return DEMO_CHARACTERS.filter(c => team.includes(c._id));
  }, [team]);

  const addToTeam = useCallback((characterId: string): boolean => {
    if (!guestData) return false;
    
    // Máximo 4 personajes en equipo demo
    if (guestData.team.length >= 4) return false;
    
    // No duplicados
    if (guestData.team.includes(characterId)) return false;
    
    const updated = {
      ...guestData,
      team: [...guestData.team, characterId]
    };
    
    saveToStorage(updated);
    setGuestData(updated);
    return true;
  }, [guestData, saveToStorage]);

  const removeFromTeam = useCallback((characterId: string) => {
    if (!guestData) return;
    
    const updated = {
      ...guestData,
      team: guestData.team.filter(id => id !== characterId)
    };
    
    saveToStorage(updated);
    setGuestData(updated);
  }, [guestData, saveToStorage]);

  // ═══════════════════════════════════════════════════════
  // PERSONAJE PARA SURVIVAL (1 solo personaje)
  // ═══════════════════════════════════════════════════════
  const getSurvivalCharacter = useCallback(() => {
    if (!survivalCharacter) return null;
    return DEMO_CHARACTERS.find(c => c._id === survivalCharacter) || null;
  }, [survivalCharacter]);

  const selectSurvivalCharacter = useCallback((characterId: string): boolean => {
    if (!guestData) return false;
    
    // Verificar que el personaje existe
    const exists = DEMO_CHARACTERS.some(c => c._id === characterId);
    if (!exists) return false;
    
    const updated = {
      ...guestData,
      survivalCharacter: characterId
    };
    
    saveToStorage(updated);
    setGuestData(updated);
    return true;
  }, [guestData, saveToStorage]);

  const clearSurvivalCharacter = useCallback(() => {
    if (!guestData) return;
    
    const updated = {
      ...guestData,
      survivalCharacter: null
    };
    
    saveToStorage(updated);
    setGuestData(updated);
  }, [guestData, saveToStorage]);

  // ═══════════════════════════════════════════════════════
  // PROGRESO (local)
  // ═══════════════════════════════════════════════════════
  const updateProgress = useCallback((partial: Partial<GuestData['progress']>) => {
    if (!guestData) return;
    const updated = {
      ...guestData,
      progress: { ...guestData.progress, ...partial }
    };
    saveToStorage(updated);
    setGuestData(updated);
  }, [guestData, saveToStorage]);

  const completeTutorial = useCallback(() => {
    updateProgress({ tutorialCompleted: true });
  }, [updateProgress]);

  const addTutorialWin = useCallback(() => {
    updateProgress({ tutorialWins: (progress?.tutorialWins || 0) + 1 });
  }, [updateProgress, progress]);

  const useSurvivalTrial = useCallback((): boolean => {
    if (progress?.survivalTrialUsed) return false;
    updateProgress({ survivalTrialUsed: true });
    return true;
  }, [progress, updateProgress]);

  const canPlaySurvival = useMemo(() => 
    !progress?.survivalTrialUsed, [progress]);

  // ═══════════════════════════════════════════════════════
  // RECURSOS (local)
  // ═══════════════════════════════════════════════════════
  const spendEnergy = useCallback((amount: number): boolean => {
    if (!guestData || guestData.resources.energy < amount) return false;
    
    const updated = {
      ...guestData,
      resources: {
        ...guestData.resources,
        energy: guestData.resources.energy - amount
      }
    };
    
    saveToStorage(updated);
    setGuestData(updated);
    return true;
  }, [guestData, saveToStorage]);

  // ═══════════════════════════════════════════════════════
  // LIMPIAR (cuando se registra)
  // ═══════════════════════════════════════════════════════
  const clearGuestData = useCallback(() => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setGuestData(null);
  }, []);

  return {
    guestData,
    isGuest,
    resources,
    team,
    progress,
    survivalCharacter,
    createGuestSession,
    getTeamCharacters,
    addToTeam,
    removeFromTeam,
    getSurvivalCharacter,
    selectSurvivalCharacter,
    clearSurvivalCharacter,
    completeTutorial,
    addTutorialWin,
    useSurvivalTrial,
    canPlaySurvival,
    spendEnergy,
    clearGuestData,
  };
}
```

---

## 🎭 Datos Mock (Hardcodeados en Frontend)

```typescript
// demo-data.ts - Datos locales, NO vienen del backend

// ═══════════════════════════════════════════════════════
// PERSONAJES DEMO
// ═══════════════════════════════════════════════════════
export const DEMO_CHARACTERS = [
  {
    _id: 'demo_warrior',
    nombre: 'Guerrero',
    clase: 'Guerrero',
    rango: 'Bronce',
    nivel: 5,
    etapa: 1,
    stats: {
      salud: 150,
      saludMaxima: 150,
      ataque: 25,
      defensa: 20,
      velocidad: 10,
      critico: 5
    },
    habilidades: [
      { id: 'slash', nombre: 'Tajo', daño: 30, costo: 0 },
      { id: 'shield', nombre: 'Escudo', defensa: 15, costo: 10 }
    ],
    avatar: '/assets/demo/warrior.png'
  },
  {
    _id: 'demo_mage',
    nombre: 'Mago',
    clase: 'Mago',
    rango: 'Bronce',
    nivel: 5,
    etapa: 1,
    stats: {
      salud: 80,
      saludMaxima: 80,
      ataque: 40,
      defensa: 10,
      velocidad: 15,
      critico: 10
    },
    habilidades: [
      { id: 'fireball', nombre: 'Bola de Fuego', daño: 45, costo: 15 },
      { id: 'heal', nombre: 'Curar', heal: 30, costo: 20 }
    ],
    avatar: '/assets/demo/mage.png'
  },
  {
    _id: 'demo_archer',
    nombre: 'Arquero',
    clase: 'Arquero',
    rango: 'Bronce',
    nivel: 5,
    etapa: 1,
    stats: {
      salud: 100,
      saludMaxima: 100,
      ataque: 30,
      defensa: 12,
      velocidad: 25,
      critico: 15
    },
    habilidades: [
      { id: 'arrow', nombre: 'Flecha', daño: 35, costo: 0 },
      { id: 'multishot', nombre: 'Ráfaga', daño: 20, hits: 3, costo: 15 }
    ],
    avatar: '/assets/demo/archer.png'
  },
  {
    _id: 'demo_tank',
    nombre: 'Tanque',
    clase: 'Paladín',
    rango: 'Bronce',
    nivel: 5,
    etapa: 1,
    stats: {
      salud: 200,
      saludMaxima: 200,
      ataque: 15,
      defensa: 35,
      velocidad: 5,
      critico: 2
    },
    habilidades: [
      { id: 'bash', nombre: 'Golpe', daño: 20, costo: 0 },
      { id: 'taunt', nombre: 'Provocar', efecto: 'aggro', costo: 10 }
    ],
    avatar: '/assets/demo/tank.png'
  }
];

// ═══════════════════════════════════════════════════════
// ENEMIGOS DEMO (para tutorial)
// ═══════════════════════════════════════════════════════
export const DEMO_ENEMIES = [
  {
    id: 'slime',
    nombre: 'Slime',
    nivel: 1,
    stats: { salud: 30, ataque: 5, defensa: 2 },
    avatar: '/assets/demo/enemies/slime.png'
  },
  {
    id: 'goblin',
    nombre: 'Goblin',
    nivel: 2,
    stats: { salud: 50, ataque: 10, defensa: 5 },
    avatar: '/assets/demo/enemies/goblin.png'
  },
  {
    id: 'orc',
    nombre: 'Orco',
    nivel: 3,
    stats: { salud: 80, ataque: 15, defensa: 10 },
    avatar: '/assets/demo/enemies/orc.png'
  },
  {
    id: 'boss_troll',
    nombre: 'Troll (Boss)',
    nivel: 5,
    stats: { salud: 150, ataque: 25, defensa: 15 },
    avatar: '/assets/demo/enemies/troll.png',
    isBoss: true
  }
];

// ═══════════════════════════════════════════════════════
// DUNGEON TUTORIAL (local)
// ═══════════════════════════════════════════════════════
export const TUTORIAL_DUNGEON = {
  id: 'tutorial',
  nombre: 'Cueva de Entrenamiento',
  descripcion: 'Aprende los controles básicos',
  niveles: [
    {
      nivel: 1,
      enemigos: ['slime', 'slime'],
      mensaje: '¡Usa ATACAR para golpear!'
    },
    {
      nivel: 2,
      enemigos: ['goblin'],
      mensaje: 'Prueba usar una HABILIDAD'
    },
    {
      nivel: 3,
      enemigos: ['orc', 'goblin'],
      mensaje: '¡Combate múltiple!'
    },
    {
      nivel: 4,
      enemigos: ['boss_troll'],
      mensaje: '¡BOSS FINAL!',
      isBoss: true
    }
  ],
  recompensaDemo: {
    val: 50,
    exp: 100,
    mensaje: '¡En el juego real ganarías recompensas de verdad!'
  }
};

// ═══════════════════════════════════════════════════════
// SURVIVAL TRIAL (local, 1 sola vez, 1 PERSONAJE)
// ═══════════════════════════════════════════════════════
export const SURVIVAL_TRIAL = {
  id: 'survival_trial',
  nombre: 'Supervivencia (Prueba)',
  descripcion: 'Elige UN personaje y sobrevive las oleadas',
  maxOleadas: 5,
  oleadas: [
    { oleada: 1, enemigos: ['slime', 'slime', 'slime'] },
    { oleada: 2, enemigos: ['goblin', 'goblin'] },
    { oleada: 3, enemigos: ['orc', 'goblin', 'slime'] },
    { oleada: 4, enemigos: ['orc', 'orc'] },
    { oleada: 5, enemigos: ['boss_troll'], isBoss: true }
  ]
};

// ═══════════════════════════════════════════════════════
// ITEMS DEMO (solo para mostrar en UI, no funcionales)
// ═══════════════════════════════════════════════════════
export const DEMO_ITEMS = {
  equipment: [
    { id: 'sword_demo', nombre: 'Espada de Hierro', tipo: 'Arma', stats: { ataque: 10 } },
    { id: 'armor_demo', nombre: 'Armadura de Cuero', tipo: 'Armadura', stats: { defensa: 8 } },
    { id: 'ring_demo', nombre: 'Anillo Básico', tipo: 'Accesorio', stats: { critico: 3 } }
  ],
  consumables: [
    { id: 'potion_demo', nombre: 'Poción de Salud', efecto: 'Cura 50 HP', usos: 3 },
    { id: 'elixir_demo', nombre: 'Elixir de Energía', efecto: '+20 Energía', usos: 2 }
  ]
};
```

---

## ⚔️ Simulador de Combate Local (React Hook)

```tsx
// hooks/useCombatSimulator.ts - Combate 100% local, sin backend

import { useState, useCallback } from 'react';
import { DEMO_ENEMIES } from './demo-data';

export interface CombatState {
  turno: number;
  modo: 'dungeon' | 'survival';
  jugadorHP: number;
  jugadorMaxHP: number;
  jugadorATK?: number;
  enemigos: EnemyState[];
  log: string[];
  estado: 'activo' | 'victoria' | 'derrota';
}

interface EnemyState {
  id: string;
  nombre: string;
  hp: number;
  maxHp: number;
  ataque: number;
}

export function useCombatSimulator() {
  const [state, setState] = useState<CombatState | null>(null);

  // ═══════════════════════════════════════════════════════
  // INICIAR COMBATE DUNGEON (local) - USA EQUIPO
  // ═══════════════════════════════════════════════════════
  const startDungeonCombat = useCallback((
    teamStats: { salud: number }, 
    enemyIds: string[]
  ) => {
    const enemigos = enemyIds.map(id => {
      const template = DEMO_ENEMIES.find(e => e.id === id)!;
      return {
        id: template.id,
        nombre: template.nombre,
        hp: template.stats.salud,
        maxHp: template.stats.salud,
        ataque: template.stats.ataque
      };
    });
    
    setState({
      turno: 1,
      modo: 'dungeon',
      jugadorHP: teamStats.salud,
      jugadorMaxHP: teamStats.salud,
      enemigos,
      log: ['¡Combate de Dungeon iniciado!'],
      estado: 'activo'
    });
  }, []);

  // ═══════════════════════════════════════════════════════
  // INICIAR COMBATE SURVIVAL (local) - USA 1 PERSONAJE
  // ═══════════════════════════════════════════════════════
  const startSurvivalCombat = useCallback((
    characterStats: { salud: number; ataque: number }, 
    enemyIds: string[]
  ) => {
    const enemigos = enemyIds.map(id => {
      const template = DEMO_ENEMIES.find(e => e.id === id)!;
      return {
        id: template.id,
        nombre: template.nombre,
        hp: template.stats.salud,
        maxHp: template.stats.salud,
        ataque: template.stats.ataque
      };
    });
    
    setState({
      turno: 1,
      modo: 'survival',
      jugadorHP: characterStats.salud,
      jugadorMaxHP: characterStats.salud,
      jugadorATK: characterStats.ataque,
      enemigos,
      log: ['¡Survival iniciado! Sobrevive las oleadas'],
      estado: 'activo'
    });
  }, []);

  // ═══════════════════════════════════════════════════════
  // TURNO DEL ENEMIGO (interno)
  // ═══════════════════════════════════════════════════════
  const processEnemyTurn = useCallback((
    current: CombatState, 
    enemigos: EnemyState[], 
    log: string[],
    damageMultiplier = 1
  ) => {
    let jugadorHP = current.jugadorHP;
    
    for (const enemigo of enemigos) {
      if (enemigo.hp <= 0) continue;
      const damage = Math.floor(enemigo.ataque * damageMultiplier * (0.8 + Math.random() * 0.4));
      jugadorHP = Math.max(0, jugadorHP - damage);
      log.push(`${enemigo.nombre} te ataca por ${damage} de daño!`);
    }
    
    if (jugadorHP <= 0) {
      setState({
        ...current,
        jugadorHP: 0,
        enemigos,
        log: [...log, '💀 Has sido derrotado...'],
        estado: 'derrota',
        turno: current.turno + 1
      });
      return;
    }
    
    setState({ ...current, jugadorHP, enemigos, log, turno: current.turno + 1 });
  }, []);

  // ═══════════════════════════════════════════════════════
  // ATACAR
  // ═══════════════════════════════════════════════════════
  const attack = useCallback((targetIndex: number, damage: number) => {
    if (!state || state.estado !== 'activo') return;
    
    const enemigos = [...state.enemigos];
    const target = enemigos[targetIndex];
    
    if (!target || target.hp <= 0) return;
    
    const actualDamage = Math.floor(damage * (0.9 + Math.random() * 0.2));
    target.hp = Math.max(0, target.hp - actualDamage);
    
    const log = [...state.log, `¡Atacas a ${target.nombre} por ${actualDamage} de daño!`];
    
    if (target.hp <= 0) {
      log.push(`💀 ${target.nombre} derrotado!`);
    }
    
    if (enemigos.every(e => e.hp <= 0)) {
      setState({ ...state, enemigos, log: [...log, '🎉 ¡VICTORIA!'], estado: 'victoria' });
      return;
    }
    
    processEnemyTurn(state, enemigos, log);
  }, [state, processEnemyTurn]);

  // ═══════════════════════════════════════════════════════
  // DEFENDER
  // ═══════════════════════════════════════════════════════
  const defend = useCallback(() => {
    if (!state || state.estado !== 'activo') return;
    const log = [...state.log, '🛡️ Te preparas para defender (daño reducido 50%)'];
    processEnemyTurn(state, state.enemigos, log, 0.5);
  }, [state, processEnemyTurn]);

  // ═══════════════════════════════════════════════════════
  // USAR HABILIDAD
  // ═══════════════════════════════════════════════════════
  const useSkill = useCallback((skillId: string, targetIndex: number, skillData: any) => {
    if (!state || state.estado !== 'activo') return;
    
    if (skillData.daño) {
      attack(targetIndex, skillData.daño);
    } else if (skillData.heal) {
      const newHP = Math.min(state.jugadorMaxHP, state.jugadorHP + skillData.heal);
      const log = [...state.log, `💚 Te curas ${skillData.heal} HP`];
      setState({ ...state, jugadorHP: newHP, log });
      setTimeout(() => {
        setState(prev => prev && processEnemyTurn(prev, prev.enemigos, prev.log));
      }, 500);
    }
  }, [state, attack, processEnemyTurn]);

  const reset = useCallback(() => setState(null), []);

  return {
    state,
    startDungeonCombat,
    startSurvivalCombat,
    attack,
    defend,
    useSkill,
    reset,
  };
}
```

---

## 🎮 Componente de Combate Demo (React)

```tsx
// components/DemoCombat.tsx

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCombatSimulator } from '../hooks/useCombatSimulator';
import { useGuest } from '../hooks/useGuest';

export function DemoCombat() {
  const { state, attack, defend, useSkill, reset } = useCombatSimulator();
  const { getTeamCharacters } = useGuest();
  const navigate = useNavigate();
  
  const [selectedTarget, setSelectedTarget] = useState(0);
  
  const teamStats = useMemo(() => {
    const team = getTeamCharacters();
    return {
      salud: team.reduce((sum, c) => sum + c.stats.salud, 0),
      ataque: team.reduce((sum, c) => sum + c.stats.ataque, 0)
    };
  }, [getTeamCharacters]);
  
  const currentCharacterSkills = useMemo(() => {
    const team = getTeamCharacters();
    return team[0]?.habilidades || [];
  }, [getTeamCharacters]);

  if (!state) return null;

  const hpPercent = (state.jugadorHP / state.jugadorMaxHP) * 100;

  return (
    <div className="combat-arena">
      {/* Barra de vida del jugador */}
      <div className="player-hp">
        <div className="hp-bar">
          <div className="hp-fill" style={{ width: `${hpPercent}%` }} />
        </div>
        <span>{state.jugadorHP} / {state.jugadorMaxHP}</span>
      </div>

      {/* Enemigos */}
      <div className="enemies">
        {state.enemigos.map((enemy, i) => (
          <div 
            key={enemy.id}
            className={`enemy ${enemy.hp <= 0 ? 'dead' : ''}`}
            onClick={() => setSelectedTarget(i)}
          >
            <img src={`/assets/demo/enemies/${enemy.id}.png`} alt={enemy.nombre} />
            <span className="name">{enemy.nombre}</span>
            <div className="hp-bar small">
              <div 
                className="hp-fill" 
                style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} 
              />
            </div>
            <span className="hp-text">{enemy.hp}/{enemy.maxHp}</span>
          </div>
        ))}
      </div>

      {/* Acciones */}
      {state.estado === 'activo' && (
        <div className="actions">
          <button className="attack" onClick={() => attack(selectedTarget, teamStats.ataque)}>
            ⚔️ Atacar
          </button>
          <button className="defend" onClick={defend}>
            🛡️ Defender
          </button>
          {currentCharacterSkills.map(skill => (
            <button 
              key={skill.id} 
              onClick={() => useSkill(skill.id, selectedTarget, skill)}
            >
              {skill.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Resultado */}
      {state.estado !== 'activo' && (
        <div className="result">
          <h2>{state.estado === 'victoria' ? '🎉 ¡VICTORIA!' : '💀 Derrota'}</h2>
          
          {state.estado === 'victoria' && (
            <p>
              En el juego completo ganarías recompensas reales.<br />
              <strong>¡Regístrate para jugar de verdad!</strong>
            </p>
          )}
          
          <button onClick={() => { reset(); navigate('/dashboard'); }}>
            Volver
          </button>
          <button className="primary" onClick={() => navigate('/register')}>
            Crear Cuenta
          </button>
        </div>
      )}

      {/* Log de combate */}
      <div className="combat-log">
        {state.log.slice(-5).map((entry, i) => (
          <p key={i}>{entry}</p>
        ))}
      </div>
    </div>
  );
}
```

---

---

## ✅ Funcionalidades por Tipo de Cuenta

### Lo que PUEDE hacer un invitado (100% local):

| Funcionalidad | Disponible | Cómo funciona |
|---------------|------------|---------------|
| Ver Dashboard | ✅ | Datos mock locales |
| Ver personajes demo | ✅ | `DEMO_CHARACTERS` hardcodeado |
| Armar equipo | ✅ | localStorage |
| Jugar Tutorial Dungeon | ✅ | `CombatSimulatorService` local |
| Jugar Survival (1 vez) | ✅ | Simulación local, se marca como usada |
| Ver Rankings | ✅ | `GET /api/rankings` (público, sin auth) |
| Ver Tienda (catálogo) | ✅ | `GET /api/shop/packages` (público) |
| Ver Marketplace | ✅ | `GET /api/marketplace/listings` (público) |

### Lo que NO puede hacer (requiere registro):

| Funcionalidad | Bloqueado | Qué mostrar |
|---------------|-----------|-------------|
| Comprar en Tienda | 🔒 | Modal "Regístrate para comprar" |
| Vender en Marketplace | 🔒 | Modal "Crea cuenta para vender" |
| Comprar en Marketplace | 🔒 | Modal "Regístrate para comprar" |
| Guardar progreso real | 🔒 | Banner "Progreso temporal" |
| Dungeons reales | 🔒 | "Solo tutorial disponible" |
| Survival ilimitado | 🔒 | "Ya usaste tu partida de prueba" |
| Aparecer en Rankings | 🔒 | "Regístrate para competir" |
| Chat global | 🔒 | "Crea cuenta para chatear" |
| Evolucionar personajes | 🔒 | "Regístrate para evolucionar" |
| Abrir paquetes | 🔒 | "Crea cuenta para abrir" |

---

## 🏗️ Arquitectura 100% Frontend

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODO INVITADO - SIN BACKEND                      │
└─────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │   localStorage  │
                         │                 │
                         │  • guestData    │
                         │  • team         │
                         │  • progress     │
                         └────────┬────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                    │
│                                                                     │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│   │GuestService │    │CombatSim    │    │ demo-data   │            │
│   │(localStorage│    │(local)      │    │ (constantes)│            │
│   └─────────────┘    └─────────────┘    └─────────────┘            │
│          │                  │                  │                    │
│          └──────────────────┼──────────────────┘                    │
│                             │                                       │
│                             ▼                                       │
│                    ┌─────────────────┐                              │
│                    │   Componentes   │                              │
│                    │   de UI Demo    │                              │
│                    └─────────────────┘                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Solo endpoints PÚBLICOS (sin auth)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (mínimo)                            │
│                                                                     │
│   Solo se usa para:                                                 │
│   • GET /api/rankings (público) - ver leaderboard                   │
│   • GET /api/shop/packages (público) - ver catálogo                 │
│   • GET /api/marketplace/listings (público) - ver items             │
│   • POST /api/auth/register (cuando se registra)                    │
│   • POST /api/auth/login (cuando hace login)                        │
│                                                                     │
│   ⚠️ NO hay endpoints de guest, todo es local                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Servicio Auth Combinado (Guest + Registrado) - React Hook

```tsx
// hooks/useAuth.ts - Maneja ambos tipos de cuenta

import { useState, useCallback, useMemo } from 'react';
import { useApi } from './useApi';
import { useGuest } from './useGuest';

interface User {
  id: string;
  email: string;
  username: string;
  isDemo?: boolean;
  resources?: any;
}

export function useAuth() {
  const { post } = useApi();
  const { isGuest, guestData, resources, createGuestSession, clearGuestData } = useGuest();
  
  const [registeredUser, setRegisteredUser] = useState<User | null>(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user ? JSON.parse(user) : null;
  });

  // ═══════════════════════════════════════════════════════
  // COMPUTED: ¿Qué tipo de usuario es?
  // ═══════════════════════════════════════════════════════
  const isRegistered = useMemo(() => !!registeredUser, [registeredUser]);
  const isLoggedIn = useMemo(() => isGuest || isRegistered, [isGuest, isRegistered]);
  
  const currentUser = useMemo(() => {
    if (isRegistered) return registeredUser;
    if (isGuest) {
      return {
        id: guestData?.id,
        isDemo: true,
        resources
      } as User;
    }
    return null;
  }, [isRegistered, registeredUser, isGuest, guestData, resources]);

  // ═══════════════════════════════════════════════════════
  // GUEST: Crear sesión local (sin backend)
  // ═══════════════════════════════════════════════════════
  const startAsGuest = useCallback(() => {
    createGuestSession();
  }, [createGuestSession]);

  // ═══════════════════════════════════════════════════════
  // REGISTRADO: Login (con backend)
  // ═══════════════════════════════════════════════════════
  const login = useCallback(async (email: string, password: string) => {
    const res = await post<{ user: User; token: string }>('/api/auth/login', { email, password });
    
    clearGuestData();
    setRegisteredUser(res.user);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }, [post, clearGuestData]);

  // ═══════════════════════════════════════════════════════
  // REGISTRADO: Registro (con backend)
  // ═══════════════════════════════════════════════════════
  const register = useCallback(async (email: string, password: string, username: string) => {
    const res = await post<{ user: User; token: string }>('/api/auth/register', { email, password, username });
    
    clearGuestData();
    setRegisteredUser(res.user);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }, [post, clearGuestData]);

  // ═══════════════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════════════
  const logout = useCallback(() => {
    setRegisteredUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // ═══════════════════════════════════════════════════════
  // VERIFICAR PERMISOS
  // ═══════════════════════════════════════════════════════
  const canDo = useCallback((action: string): boolean => {
    if (isRegistered) return true;
    
    const GUEST_ALLOWED = [
      'view_dashboard',
      'view_characters',
      'build_team',
      'play_tutorial',
      'play_survival_trial',
      'view_rankings',
      'view_shop',
      'view_marketplace'
    ];
    
    return GUEST_ALLOWED.includes(action);
  }, [isRegistered]);

  return {
    currentUser,
    isGuest,
    isRegistered,
    isLoggedIn,
    startAsGuest,
    login,
    register,
    logout,
    canDo,
  };
}
```

---

## 🎨 UI/UX para Modo Invitado

### 1. Pantalla de Entrada (Landing)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                         🎮 VALGAME                                  │
│                                                                     │
│                    "El RPG que te atrapará"                         │
│                                                                     │
│         ┌─────────────────────────────────────────────┐             │
│         │                                             │             │
│         │    ⚡ JUGAR AHORA (sin registro)            │             │
│         │                                             │             │
│         └─────────────────────────────────────────────┘             │
│                                                                     │
│                           ─── o ───                                 │
│                                                                     │
│         ┌─────────────────┐    ┌─────────────────┐                  │
│         │   📧 Registro   │    │   🔑 Login      │                  │
│         └─────────────────┘    └─────────────────┘                  │
│                                                                     │
│              "El progreso de invitado es temporal"                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Banner de Invitado (Siempre visible) - React

```tsx
// components/GuestBanner.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './GuestBanner.css';

export function GuestBanner() {
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  
  if (!isGuest || dismissed) return null;
  
  return (
    <div className="guest-banner">
      <span>🎮 Modo Invitado - Tu progreso es temporal</span>
      <button onClick={() => navigate('/register')}>Crear Cuenta Gratis</button>
      <button className="dismiss" onClick={() => setDismissed(true)}>✕</button>
    </div>
  );
}

// GuestBanner.css
/*
.guest-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, #ff6b6b, #ffa502);
  color: white;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 1000;
}

.guest-banner button {
  background: white;
  color: #ff6b6b;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.guest-banner .dismiss {
  background: transparent;
  color: white;
  padding: 4px 8px;
}
*/
```

### 3. Dashboard de Invitado

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️ MODO INVITADO - Tu progreso es temporal  [Crear Cuenta]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   JUGAR     │  │   TIENDA    │  │ MARKETPLACE │  │  EQUIPOS   │ │
│  │   ⚔️        │  │   🔒        │  │    🔒       │  │    👥      │ │
│  │  Tutorial   │  │  Solo ver   │  │  Solo ver   │  │   Demo     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
│  ┌──────────────────────────────┐  ┌─────────────────────────────┐ │
│  │     EQUIPO DEMO              │  │      TU PROGRESO (DEMO)     │ │
│  │  [Guerrero] [Mago] [Arquero] │  │  Partidas: 0  |  Nivel: 1   │ │
│  │    Personajes de prueba      │  │  ⚠️ No se guardará          │ │
│  └──────────────────────────────┘  └─────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🎁 REGÍSTRATE Y OBTÉN:                                     │   │
│  │  • 500 VAL de bienvenida                                    │   │
│  │  • 1 Paquete Pionero GRATIS                                 │   │
│  │  • Guarda tu progreso para siempre                          │   │
│  │                                                             │   │
│  │              [CREAR CUENTA GRATIS]                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎮 Flujos de Juego Demo (Invitado)

### Selector de Modo (Invitado)

Cuando el invitado presiona **"JUGAR"**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    🎮 ELIGE TU MODO DE PRUEBA                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌───────────────────────────┐   ┌───────────────────────────┐    │
│   │    🏰 TUTORIAL DUNGEON    │   │     ☠️ SURVIVAL TRIAL     │    │
│   │                           │   │                           │    │
│   │   "Aprende lo básico"     │   │   "Prueba el survival"    │    │
│   │                           │   │                           │    │
│   │  ┌─────────────────────┐  │   │  ┌─────────────────────┐  │    │
│   │  │  👥 USA TU EQUIPO   │  │   │  │  👤 ELIGE 1 HÉROE   │  │    │
│   │  │  (4 personajes demo)│  │   │  │  (solo 1 personaje) │  │    │
│   │  └─────────────────────┘  │   │  └─────────────────────┘  │    │
│   │                           │   │                           │    │
│   │  • 4 niveles de tutorial  │   │  • 5 oleadas de prueba    │    │
│   │  • Combate por turnos     │   │  • ¡Solo 1 oportunidad!   │    │
│   │  • Sin límite de intentos │   │                           │    │
│   │                           │   │  ⚠️ Partidas restantes: 1 │    │
│   │                           │   │                           │    │
│   │      [ JUGAR TUTORIAL ]   │   │      [ JUGAR SURVIVAL ]   │    │
│   └───────────────────────────┘   └───────────────────────────┘    │
│                                                                     │
│    ⚠️ En el juego completo tendrás más mazmorras y survival        │
│       ilimitado. ¡Regístrate para desbloquear todo!                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Flujo Tutorial Dungeon (EQUIPO - múltiples personajes)

```
[Presiona TUTORIAL DUNGEON]
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│              👥 CONFIRMA TU EQUIPO DE PRUEBA                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Tu equipo demo para el tutorial:                             │
│                                                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│  │   👤   │ │   👤   │ │   👤   │ │   👤   │                 │
│  │Guerrero│ │  Mago  │ │Arquero │ │Paladín │                 │
│  │ Lv 5   │ │ Lv 5   │ │ Lv 5   │ │ Lv 5   │                 │
│  │⚔️ 25   │ │⚔️ 40   │ │⚔️ 30   │ │⚔️ 15   │                 │
│  │🛡️ 20   │ │🛡️ 10   │ │🛡️ 12   │ │🛡️ 35   │                 │
│  │[Quitar]│ │[Quitar]│ │[Quitar]│ │[Quitar]│                 │
│  └────────┘ └────────┘ └────────┘ └────────┘                 │
│                                                               │
│  Stats combinadas del equipo:                                 │
│  ⚔️ ATK Total: 110  |  🛡️ DEF Total: 77  |  ❤️ HP: 530       │
│                                                               │
│            [ ⚔️ INICIAR TUTORIAL ]                            │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
[Tutorial 4 niveles: Slimes → Goblin → Orcos → Boss Troll]
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                   🎉 ¡TUTORIAL COMPLETADO!                    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ¡Excelente! Has aprendido los controles básicos.            │
│                                                               │
│  En el juego completo ganarías:                               │
│  • 150 EXP para tus personajes                                │
│  • 25 VAL de recompensa                                       │
│  • Items y equipamiento                                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🎁 ¡Regístrate y obtén 500 VAL + Paquete Pionero!     │ │
│  │              [ CREAR CUENTA GRATIS ]                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [ Volver al Dashboard ]   [ Repetir Tutorial ]              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

### Flujo Survival Trial (1 SOLO PERSONAJE)

```
[Presiona SURVIVAL TRIAL]
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│             👤 ELIGE UN SOLO HÉROE PARA SURVIVAL              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ⚠️ En Survival solo puedes llevar UN personaje.             │
│     ¡Elige sabiamente!                                        │
│                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │    👤      │ │    👤      │ │    👤      │ │    👤      │ │
│  │  Guerrero  │ │   Mago     │ │  Arquero   │ │  Paladín   │ │
│  │   Lv 5     │ │   Lv 5     │ │   Lv 5     │ │   Lv 5     │ │
│  │            │ │            │ │            │ │            │ │
│  │ ⚔️ ATK: 25 │ │ ⚔️ ATK: 40 │ │ ⚔️ ATK: 30 │ │ ⚔️ ATK: 15 │ │
│  │ 🛡️ DEF: 20 │ │ 🛡️ DEF: 10 │ │ 🛡️ DEF: 12 │ │ 🛡️ DEF: 35 │ │
│  │ ❤️ HP: 150 │ │ ❤️ HP: 80  │ │ ❤️ HP: 100 │ │ ❤️ HP: 200 │ │
│  │            │ │            │ │            │ │            │ │
│  │ ○ Elegir  │ │ ○ Elegir  │ │ ○ Elegir  │ │ ● ELEGIDO  │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                               │
│  Personaje seleccionado: Paladín                              │
│  "Tanque resistente, ideal para sobrevivir oleadas"           │
│                                                               │
│  ⚠️ Esta es tu ÚNICA partida de prueba de Survival            │
│                                                               │
│               [ ☠️ INICIAR SURVIVAL ]                         │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
[Survival: 5 oleadas - Slimes → Goblins → Orcos → Boss]
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                   ☠️ SURVIVAL COMPLETADO                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Oleada alcanzada: 4 de 5                                     │
│  Score: 1,250 puntos                                          │
│                                                               │
│  En el juego completo:                                        │
│  • Survival es ILIMITADO                                      │
│  • Ganas EXP y VAL reales                                     │
│  • Compites en el ranking global                              │
│  • Desbloqueas escenarios especiales                          │
│                                                               │
│  ⚠️ Ya usaste tu partida de prueba de Survival               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🎁 ¡Regístrate para jugar Survival ilimitado!         │ │
│  │              [ CREAR CUENTA GRATIS ]                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [ Volver al Dashboard ]   [ Ver Rankings (solo lectura) ]   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🎁 REGÍSTRATE Y OBTÉN:                                     │   │
│  │  • 500 VAL de bienvenida                                    │   │
│  │  • 1 Paquete Pionero GRATIS                                 │   │
│  │  • Guarda tu progreso para siempre                          │   │
│  │                                                             │   │
│  │              [CREAR CUENTA GRATIS]                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Bloqueo de Funcionalidad (Modal) - React

```tsx
// components/FeatureLockedModal.tsx
import { useNavigate } from 'react-router-dom';
import './FeatureLockedModal.css';

interface FeatureLockedModalProps {
  title?: string;
  message?: string;
  onClose: () => void;
}

export function FeatureLockedModal({ 
  title = 'Función Bloqueada', 
  message = 'Necesitas una cuenta para usar esta función',
  onClose 
}: FeatureLockedModalProps) {
  const navigate = useNavigate();
  
  const handleRegister = () => {
    navigate('/register');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="icon">🔒</div>
        <h2>{title}</h2>
        <p>{message}</p>
        
        <div className="benefits">
          <h4>Al registrarte obtienes:</h4>
          <ul>
            <li>✅ Acceso completo al Marketplace</li>
            <li>✅ Comprar paquetes y items</li>
            <li>✅ Guardar tu progreso</li>
            <li>✅ 500 VAL de bienvenida</li>
          </ul>
        </div>
        
        <div className="actions">
          <button className="primary" onClick={handleRegister}>
            Crear Cuenta Gratis
          </button>
          <button className="secondary" onClick={onClose}>
            Seguir como invitado
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 5. Indicadores Visuales de Bloqueo (CSS)

```css
/* En cards bloqueadas */
.action-card.locked {
  position: relative;
  opacity: 0.7;
}

.action-card.locked::after {
  content: '🔒';
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 20px;
}

.action-card.locked:hover {
  cursor: not-allowed;
  border-color: #ff6b6b;
}

.action-card.locked:hover .lock-tooltip {
  display: block;
}

/* Tooltip de bloqueo */
.lock-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.lock-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #333;
}
```

---

## 🔄 Flujo de Conversión (Guest → Registrado)

```
┌─────────────────────────────────────────────────────────────────┐
│                  FLUJO DE CONVERSIÓN                            │
└─────────────────────────────────────────────────────────────────┘

[Landing Page]
      │
      ├──→ "JUGAR AHORA" ──→ [Crear Guest Session]
      │                              │
      │                              ▼
      │                       [Dashboard Invitado]
      │                              │
      │         ┌────────────────────┼────────────────────┐
      │         │                    │                    │
      │         ▼                    ▼                    ▼
      │    [Tutorial]           [Survival]          [Team Demo]
      │    Dungeon              Trial (1x)          (local)
      │         │                    │                    │
      │         └────────────────────┼────────────────────┘
      │                              │
      │                              ▼
      │                    Quiere usar feature bloqueada
      │                    (Marketplace, Shop, guardar)
      │                              │
      │                              ▼
      │                    [Modal: "Regístrate"]
      │                              │
      │              ┌───────────────┴───────────────┐
      │              │                               │
      │              ▼                               ▼
      │    [Seguir como invitado]          [Ir a Registro]
      │              │                               │
      │              │                               ▼
      │              │                    [Formulario Registro]
      │              │                    email + password
      │              │                               │
      │              │                               ▼
      │              │                    POST /auth/register
      │              │                    { upgradeFrom: guestId }
      │              │                               │
      │              │                               ▼
      │              │                    [Cuenta Creada]
      │              │                    + 500 VAL bienvenida
      │              │                    + Paquete Pionero
      │              │                               │
      │              │                               ▼
      │              │                    [Dashboard Completo]
      │              │                    (todas las funciones)
      │              │
      └──────────────┴───────────────────────────────────────────→
                   [Expira en 7 días]
                   [Se pierde progreso demo]
```

---

## 🛡️ Protección de Rutas (React Router)

```tsx
// components/RequireAuth.tsx - Componente para proteger rutas
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FeatureLockedModal } from './FeatureLockedModal';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isRegistered, isGuest } = useAuth();
  const [showModal, setShowModal] = useState(true);
  
  if (isRegistered) {
    return <>{children}</>;
  }
  
  // Mostrar modal para invitados
  if (isGuest && showModal) {
    return (
      <FeatureLockedModal
        title="Acceso Restringido"
        message="Esta sección requiere una cuenta registrada"
        onClose={() => setShowModal(false)}
      />
    );
  }
  
  // Si no hay usuario, redirigir a login
  return <Navigate to="/login" replace />;
}

// App.tsx - Configuración de rutas con React Router
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas (invitados pueden ver) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/shop" element={<ShopView />} />
        <Route path="/marketplace" element={<MarketplaceView />} />
        
        {/* Solo invitados (demo) */}
        <Route path="/tutorial" element={<TutorialDungeon />} />
        <Route path="/survival-trial" element={<SurvivalTrial />} />
        
        {/* Solo registrados (protegidas) */}
        <Route path="/shop/checkout" element={
          <RequireAuth><ShopCheckout /></RequireAuth>
        } />
        <Route path="/marketplace/sell" element={
          <RequireAuth><MarketplaceSell /></RequireAuth>
        } />
        <Route path="/marketplace/buy/:id" element={
          <RequireAuth><MarketplaceBuy /></RequireAuth>
        } />
        <Route path="/inventory" element={
          <RequireAuth><Inventory /></RequireAuth>
        } />
        <Route path="/dungeons/:id" element={
          <RequireAuth><Dungeon /></RequireAuth>
        } />
        <Route path="/survival" element={
          <RequireAuth><Survival /></RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📱 Comparativa Visual: Invitado vs Registrado

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INVITADO                │      REGISTRADO        │
├─────────────────────────────────────────────────────────────────────┤
│                                            │                        │
│  Header:                                   │  Header:               │
│  [Logo] [⚠️ Demo] [Registrarse]           │  [Logo] [💰500] [🔔]   │
│                                            │                        │
│  Dashboard:                                │  Dashboard:            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │  ┌─────┐ ┌─────┐ ...   │
│  │Play │ │Shop│ │Mrkt │ │Team │          │  │Play │ │Shop│ ...   │
│  │ ✓  │ │ 🔒 │ │ 🔒 │ │ ✓  │          │  │ ✓  │ │ ✓  │ ...   │
│  └─────┘ └─────┘ └─────┘ └─────┘          │  └─────┘ └─────┘        │
│                                            │                        │
│  Equipo: 4 personajes demo                 │  Equipo: tus personajes│
│  Progreso: localStorage (temporal)         │  Progreso: MongoDB     │
│  VAL: 100 (demo, no real)                  │  VAL: balance real     │
│                                            │                        │
│  ┌─────────────────────────────┐           │  ┌───────────────────┐ │
│  │ 🎁 REGÍSTRATE Y OBTÉN:     │           │  │ Actividad Reciente│ │
│  │ • 500 VAL                   │           │  │ • Vendiste item   │ │
│  │ • Paquete Pionero          │           │  │ • Subiste nivel   │ │
│  │ [CREAR CUENTA]             │           │  │ • Nueva oferta    │ │
│  └─────────────────────────────┘           │  └───────────────────┘ │
│                                            │                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

### ⚠️ NO HAY BACKEND - Todo es Frontend

### Archivos a crear en Frontend (2-3 días)

**Servicios:**
- [ ] `guest.service.ts` - Maneja localStorage (estado, equipo, progreso)
- [ ] `combat-simulator.service.ts` - Combate local sin backend
- [ ] Actualizar `auth.service.ts` - Soporte para guest + registrado

**Datos Mock:**
- [ ] `demo-data.ts` - Personajes, enemigos, dungeons, items demo

**Componentes:**
- [ ] `GuestBannerComponent` - Banner sticky "Modo Invitado"
- [ ] `FeatureLockedComponent` - Modal cuando intenta algo bloqueado
- [ ] `DemoCombatComponent` - Combate local
- [ ] `TutorialDungeonComponent` - Tutorial con pasos guiados
- [ ] `SurvivalTrialComponent` - 1 partida survival local

**Guards:**
- [ ] `RegisteredOnlyGuard` - Bloquea rutas que requieren registro

**Páginas:**
- [ ] Landing page con botón "Jugar Ahora"
- [ ] Dashboard adaptativo (detecta guest vs registrado)
- [ ] Team Builder que funciona con datos demo

**Assets:**
- [ ] Avatares de personajes demo (`/assets/demo/`)
- [ ] Avatares de enemigos demo (`/assets/demo/enemies/`)

### UX/Visual (1 día)
- [ ] Diseño de cards bloqueadas (🔒)
- [ ] Banner de invitado (sticky top, dismissible)
- [ ] Modal de conversión atractivo
- [ ] Tooltips en elementos bloqueados
- [ ] Indicador visual "Demo" en recursos

---

## 🔑 Resumen: Dos Cuentas + Dos Modos

### Cuentas

| Característica | Invitado | Registrado |
|----------------|----------|------------|
| **Crear** | 1 click | Email + Pass |
| **Conexión backend** | ❌ NO | ✅ SÍ |
| **Guardar en** | localStorage | MongoDB |
| **Expira** | Al limpiar caché | Nunca |
| **Personajes** | 4 demo fijos | Los que compre/gane |
| **Dinero** | 100 VAL demo | Balance real |
| **Shop** | Solo ver | Comprar |
| **Marketplace** | Solo ver | Comprar/Vender |
| **Dungeons** | Solo tutorial (local) | Todos (backend) |
| **Survival** | 1 partida trial (local) | Ilimitado (backend) |
| **Rankings** | Solo ver | Aparece en ranking |
| **Progreso** | Temporal (local) | Permanente (DB) |

### Modos de Juego

| Característica | 🏰 RPG (Dungeons) | ☠️ Survival |
|----------------|-------------------|-------------|
| **Personajes** | **EQUIPO** (múltiples) | **1 SOLO** personaje |
| **En Demo** | Tutorial con 4 personajes | Trial con 1 personaje |
| **En Registrado** | Todas las mazmorras | Ilimitado con escenarios |
| **Combate** | Automático por turnos | Oleadas con acciones |
| **Endpoint backend** | `POST /api/dungeons/:id/start` | `POST /api/survival/start` |
| **Payload** | `{ team: ["id1", "id2", ...] }` | `{ characterId: "id" }` |

---

## 💡 Tips de Conversión

1. **Mostrar lo que se pierde**: "Tu progreso es temporal"
2. **Mostrar lo que gana**: "500 VAL + Paquete Pionero GRATIS"
3. **Friction points**: Cuando intente algo bloqueado, ofrecer registro
4. **CTA constante**: Banner siempre visible con "Crear Cuenta"
5. **Después de victoria**: "¡Genial! Regístrate para ganar recompensas reales"

---

## 📁 Estructura de Archivos Sugerida

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── auth.service.ts        # Maneja guest + registrado
│   │   │   ├── guest.service.ts       # Estado local del invitado
│   │   │   └── combat-simulator.service.ts
│   │   ├── guards/
│   │   │   └── registered-only.guard.ts
│   │   └── data/
│   │       └── demo-data.ts           # Constantes mock
│   │
│   ├── shared/
│   │   └── components/
│   │       ├── guest-banner/
│   │       └── feature-locked-modal/
│   │
│   └── features/
│       ├── demo-combat/
│       ├── tutorial-dungeon/
│       └── survival-trial/
│
└── assets/
    └── demo/
        ├── warrior.png
        ├── mage.png
        ├── archer.png
        ├── tank.png
        └── enemies/
            ├── slime.png
            ├── goblin.png
            ├── orc.png
            └── troll.png
```

---

**¿Dudas?** Consulta `AUTH_AND_FLOWS.md` para el flujo de registro normal.
