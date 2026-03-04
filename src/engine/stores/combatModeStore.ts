import { create } from 'zustand';

// Representa a los participantes en el combate 3D
export interface CombatEntity {
    id: string;
    name: string;
    isPlayer: boolean;
    maxHealth: number;
    currentHealth: number;
    level: number;
    stats: {
        attack: number;
        defense: number;
        critRate: number;
        critDamage: number;
    };
}

export interface CombatModeState {
    isActive: boolean;
    combatId: string | null;
    // Entidad enemiga actual (simplificado para 1v1 con el Golem al inicio)
    enemy: CombatEntity | null;
    player: CombatEntity | null;

    // Flujo de turnos
    turn: 'player' | 'enemy' | 'resolving' | null;

    // Para la cámara cinemática 3D
    combatCenterPosition: [number, number, number] | null;

    log: string[];

    actions: {
        initCombat: (enemy: CombatEntity, player: CombatEntity, centerPos: [number, number, number]) => void;
        endCombat: (reason: 'victory' | 'defeat' | 'fled') => void;
        setTurn: (turn: 'player' | 'enemy' | 'resolving') => void;
        addLog: (message: string) => void;
        updateHealth: (entityId: string, newHealth: number) => void;
    };
}

export const useCombatModeStore = create<CombatModeState>((set) => ({
    isActive: false,
    combatId: null,
    enemy: null,
    player: null,
    turn: null,
    combatCenterPosition: null,
    log: [],

    actions: {
        initCombat: (enemy, player, centerPos) => set({
            isActive: true,
            combatId: `local-combat-${Date.now()}`,
            enemy,
            player,
            turn: 'player', // Jugador empieza por defecto en el piloto local
            combatCenterPosition: centerPos,
            log: [`¡Inicia el combate contra ${enemy.name}!`],
        }),

        endCombat: (reason) => set((state) => ({
            isActive: false,
            turn: null,
            combatCenterPosition: null,
            log: [...state.log, `Combate finalizado: ${reason}`],
        })),

        setTurn: (turn) => set({ turn }),

        addLog: (message) => set((state) => ({
            log: [...state.log, message]
        })),

        updateHealth: (entityId, newHealth) => set((state) => {
            if (state.player?.id === entityId) {
                return { player: { ...state.player, currentHealth: newHealth } };
            }
            if (state.enemy?.id === entityId) {
                return { enemy: { ...state.enemy, currentHealth: newHealth } };
            }
            return state;
        }),
    }
}));
