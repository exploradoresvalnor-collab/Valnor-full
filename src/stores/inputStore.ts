import { create } from 'zustand';

interface InputState {
    // Movement Axis (Joystick)
    moveX: number; // -1 to 1
    moveZ: number; // -1 to 1

    // Action Buttons
    jump: boolean;
    attack: boolean;
    sprint: boolean;

    // Setters
    setMove: (x: number, z: number) => void;
    setJump: (pressed: boolean) => void;
    setAttack: (pressed: boolean) => void;
    setSprint: (pressed: boolean) => void;
}

export const useInputStore = create<InputState>((set) => ({
    moveX: 0,
    moveZ: 0,
    jump: false,
    attack: false,
    sprint: false,

    setMove: (x, z) => set({ moveX: x, moveZ: z }),
    setJump: (pressed) => set({ jump: pressed }),
    setAttack: (pressed) => set({ attack: pressed }),
    setSprint: (pressed) => set({ sprint: pressed }),
}));
