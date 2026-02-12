import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore, mapBackendPlayerData } from '../playerStore';

describe('PlayerStore', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
  });

  describe('mapBackendPlayerData', () => {
    it('should map backend data (ES) to PlayerState (EN)', () => {
      const backendData = {
        _id: 'user123',
        username: 'TestUser',
        clase: 'warrior',
        nivel: 5,
        val: 1000,
        evo: 50,
        boletos: 20,
        energia: 40,
        energiaMaxima: 50,
        estadisticas: {
          batallasGanadas: 10,
          batallasPerdidas: 2,
          mazmorrasCompletadas: 5,
          oleadaMaxima: 8,
        },
        personajes: [{ id: 'char1' }, { id: 'char2' }],
      };

      const result = mapBackendPlayerData(backendData);

      expect(result).toEqual({
        characterId: 'user123',
        characterName: 'TestUser',
        characterClass: 'warrior',
        level: 5,
        gold: 1000,
        gems: 50,
        energy: 40,
        maxEnergy: 50,
        tickets: 20,
        battlesWon: 10,
        battlesLost: 2,
        dungeonsCompleted: 5,
        maxSurvivalWave: 8,
        charactersOwned: 2,
      });
    });

    it('should handle missing backend data gracefully', () => {
      const result = mapBackendPlayerData(null);
      expect(result).toEqual({});
    });

    it('should use fallbacks for missing fields', () => {
      const backendData = { username: 'Test' };
      const result = mapBackendPlayerData(backendData);

      expect(result.characterName).toBe('Test');
      expect(result.level).toBe(1);
      expect(result.gold).toBe(0);
    });
  });

  describe('initPlayer', () => {
    it('should apply backend mapping when ES fields are present', () => {
      const backendData = {
        val: 500,
        evo: 25,
        boletos: 15,
        nivel: 3,
      } as any; // Type assertion for backend data

      usePlayerStore.getState().initPlayer(backendData);

      const state = usePlayerStore.getState();
      expect(state.gold).toBe(500);
      expect(state.gems).toBe(25);
      expect(state.tickets).toBe(15);
      expect(state.level).toBe(3);
    });

    it('should apply data directly when no ES fields', () => {
      const data = {
        gold: 200,
        level: 2,
      };

      usePlayerStore.getState().initPlayer(data);

      const state = usePlayerStore.getState();
      expect(state.gold).toBe(200);
      expect(state.level).toBe(2);
    });
  });

  describe('resource management', () => {
    beforeEach(() => {
      usePlayerStore.getState().resetPlayer();
    });

    it('should add and remove gold correctly', () => {
      // Reset and get fresh state
      usePlayerStore.getState().resetPlayer();
      
      // Use the actions directly
      usePlayerStore.getState().addGold(100);
      expect(usePlayerStore.getState().gold).toBe(100);

      const removed = usePlayerStore.getState().removeGold(50);
      expect(removed).toBe(true);
      expect(usePlayerStore.getState().gold).toBe(50);

      const failed = usePlayerStore.getState().removeGold(100);
      expect(failed).toBe(false);
      expect(usePlayerStore.getState().gold).toBe(50);
    });
  });
});