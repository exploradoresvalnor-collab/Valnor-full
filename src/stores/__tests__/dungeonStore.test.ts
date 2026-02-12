import { describe, it, expect, beforeEach } from 'vitest';
import { useDungeonStore, mapBackendDungeon } from '../dungeonStore';

describe('DungeonStore', () => {
  beforeEach(() => {
    useDungeonStore.getState().clearSelection();
  });

  describe('mapBackendDungeon', () => {
    it('should map backend dungeon data to local Dungeon type', () => {
      const backendData = {
        id: 'test-dungeon',
        nombre: 'Mazmorra de Prueba',
        descripcion: 'Una mazmorra de prueba',
        dificultad: 'normal',
        nivelRequerido: 5,
        costoEnergia: 10,
        costoBoletos: 2,
        tiempoEstimado: '5-10 min',
        oleadas: 7,
        nombreJefe: 'Jefe de Prueba',
        recompensas: {
          oro: { min: 100, max: 200 },
          experiencia: { min: 300, max: 500 },
          items: ['item1', 'item2'],
          probabilidadObjetoRaro: 0.15,
        },
        imagenFondo: 'bg.jpg',
        desbloqueada: true,
      };

      const result = mapBackendDungeon(backendData);

      expect(result).toEqual({
        id: 'test-dungeon',
        name: 'Mazmorra de Prueba',
        description: 'Una mazmorra de prueba',
        difficulty: 'normal',
        requiredLevel: 5,
        energyCost: 10,
        ticketCost: 2,
        estimatedTime: '5-10 min',
        waves: 7,
        bossName: 'Jefe de Prueba',
        rewards: {
          gold: { min: 100, max: 200 },
          exp: { min: 300, max: 500 },
          items: ['item1', 'item2'],
          rareDropChance: 0.15,
        },
        backgroundImage: 'bg.jpg',
        unlocked: true,
      });
    });

    it('should use fallbacks for missing fields', () => {
      const backendData = { id: 'test', nombre: 'Test' };
      const result = mapBackendDungeon(backendData);

      expect(result.name).toBe('Test');
      expect(result.difficulty).toBeUndefined(); // No fallback definido
      expect(result.ticketCost).toBe(1); // Fallback definido
      expect(result.rewards.gold).toEqual({ min: 100, max: 200 }); // Fallback definido
    });
  });

  describe('dungeon selection', () => {
    beforeEach(() => {
      // Load hardcoded dungeons for testing
      useDungeonStore.getState().loadDungeons();
    });

    it('should select dungeon correctly', () => {
      // Set up dungeons manually for testing
      useDungeonStore.setState({
        dungeons: [
          {
            id: 'forest-ruins',
            name: 'Ruinas del Bosque',
            description: 'Antiguas ruinas en el bosque',
            difficulty: 'easy',
            requiredLevel: 1,
            energyCost: 5,
            ticketCost: 1,
            estimatedTime: '3-5 min',
            waves: 5,
            bossName: 'Guardian del Bosque',
            rewards: {
              gold: { min: 50, max: 100 },
              exp: { min: 100, max: 200 },
              items: [],
              rareDropChance: 0.1,
            },
            backgroundImage: 'forest-bg.jpg',
            unlocked: true,
          }
        ]
      });
      
      useDungeonStore.getState().selectDungeon('forest-ruins');
      const selected = useDungeonStore.getState().selectedDungeon;
      expect(selected?.id).toBe('forest-ruins');
      expect(selected?.name).toBe('Ruinas del Bosque');
    });

    it('should clear selection', () => {
      useDungeonStore.getState().selectDungeon('forest-ruins');
      useDungeonStore.getState().clearSelection();
      expect(useDungeonStore.getState().selectedDungeon).toBeNull();
    });
  });

  describe('canEnterDungeon', () => {
    beforeEach(() => {
      useDungeonStore.getState().loadDungeons();
    });

    it('should allow entry when requirements met', () => {
      const result = useDungeonStore.getState().canEnterDungeon('forest-ruins', 5, 5);
      expect(result.canEnter).toBe(true);
    });

    it('should deny entry when level too low', () => {
      const result = useDungeonStore.getState().canEnterDungeon('crystal-cave', 3, 5);
      expect(result.canEnter).toBe(false);
      expect(result.reason).toContain('Requiere nivel 5');
    });

    it('should deny entry when tickets insufficient', () => {
      const result = useDungeonStore.getState().canEnterDungeon('shadow-temple', 15, 1);
      expect(result.canEnter).toBe(false);
      expect(result.reason).toContain('Necesitas 2 boleto');
    });
  });
});