import { create } from 'zustand';

interface InputState {
    // Movement Axis (Joystick)
    moveX: number; // -1 to 1
    moveZ: number; // -1 to 1
    moveMagnitude: number; // 0 to 1

    // Camera Look Axis (Right Joystick)
    lookX: number; // -1 to 1
    lookY: number; // -1 to 1

    // Action Buttons
    jump: boolean;
    attack: boolean;
    sprint: boolean;

    // Setters
    setMove: (x: number, z: number, magnitude?: number) => void;
    setLook: (x: number, y: number) => void;
    setJump: (pressed: boolean) => void;
    setAttack: (pressed: boolean) => void;
    setSprint: (pressed: boolean) => void;
}

export const useInputStore = create<InputState>((set) => ({
    moveX: 0,
    moveZ: 0,
    moveMagnitude: 0,
    lookX: 0,
    lookY: 0,
    jump: false,
    attack: false,
    sprint: false,

    setMove: (x, z, magnitude = 0) => set({ moveX: x, moveZ: z, moveMagnitude: magnitude }),
    setLook: (x, y) => set({ lookX: x, lookY: y }),
    setJump: (pressed) => set({ jump: pressed }),
    setAttack: (pressed) => set({ attack: pressed }),
    setSprint: (pressed) => set({ sprint: pressed }),
}));
