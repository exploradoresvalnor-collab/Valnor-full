import { describe, it, expect, beforeEach } from 'vitest';
import { useTeamStore } from '../teamStore';

describe('TeamStore', () => {
  beforeEach(() => {
    useTeamStore.getState().resetTeam();
  });

  describe('team management', () => {
    const testChar: any = {
      id: 'char1',
      name: 'Test Warrior',
      level: 5,
      class: 'warrior',
      stats: { attack: 100, defense: 80, health: 200, speed: 50 },
    };

    it('should add character to team', () => {
      const added = useTeamStore.getState().addToTeam(testChar);
      expect(added).toBe(true);
      expect(useTeamStore.getState().activeTeam).toHaveLength(1);
    });

    it('should not add duplicate character', () => {
      useTeamStore.getState().addToTeam(testChar);
      const addedAgain = useTeamStore.getState().addToTeam(testChar);
      expect(addedAgain).toBe(false);
      expect(useTeamStore.getState().activeTeam).toHaveLength(1);
    });

    it('should remove character from team', () => {
      useTeamStore.getState().addToTeam(testChar);
      useTeamStore.getState().removeFromTeam('char1');
      expect(useTeamStore.getState().activeTeam).toHaveLength(0);
    });

    it('should set team directly', () => {
      const team = [testChar];
      useTeamStore.getState().setTeam(team);
      expect(useTeamStore.getState().activeTeam).toEqual(team);
    });
  });

  describe('owned characters', () => {
    const testChar: any = { id: 'char1', name: 'Test', level: 1, class: 'warrior' };

    it('should set owned characters', () => {
      const characters = [testChar];
      useTeamStore.getState().setOwnedCharacters(characters);
      expect(useTeamStore.getState().ownedCharacters).toEqual(characters);
    });

    it('should add character to owned', () => {
      useTeamStore.getState().addCharacter(testChar);
      expect(useTeamStore.getState().ownedCharacters).toContain(testChar);
    });

    it('should remove character from owned', () => {
      useTeamStore.getState().addCharacter(testChar);
      useTeamStore.getState().removeCharacter('char1');
      expect(useTeamStore.getState().ownedCharacters).toHaveLength(0);
    });
  });

  describe('team power calculation', () => {
    it('should calculate team power correctly', () => {
      const char1: any = {
        id: 'char1',
        name: 'Warrior',
        level: 1,
        class: 'warrior',
        stats: { attack: 100, defense: 50, health: 200, speed: 30 },
      };
      const char2: any = {
        id: 'char2',
        name: 'Mage',
        level: 1,
        class: 'mage',
        stats: { attack: 80, defense: 30, health: 150, speed: 40 },
      };

      useTeamStore.getState().setTeam([char1, char2]);
      const power = useTeamStore.getState().getTeamPower();

      // Power calculation should be > 0 and reasonable
      expect(power).toBeGreaterThan(0);
      expect(typeof power).toBe('number');
    });

    it('should return 0 for empty team', () => {
      const power = useTeamStore.getState().getTeamPower();
      expect(power).toBe(0);
    });
  });

  describe('leader management', () => {
    const char1: any = { id: 'char1', name: 'Leader', level: 1, class: 'warrior' };
    const char2: any = { id: 'char2', name: 'Member', level: 1, class: 'mage' };

    it('should set leader', () => {
      useTeamStore.getState().setTeam([char1, char2]);
      useTeamStore.getState().setLeader('char1');
      expect(useTeamStore.getState().leaderId).toBe('char1');
    });

    it('should change leader when removing current leader', () => {
      useTeamStore.getState().setTeam([char1, char2]);
      useTeamStore.getState().setLeader('char1');
      useTeamStore.getState().removeFromTeam('char1');
      expect(useTeamStore.getState().leaderId).toBe('char2');
    });
  });
});