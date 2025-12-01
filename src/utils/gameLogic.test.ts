import { describe, it, expect, beforeEach } from 'vitest';
import {
  distance,
  isEnemyInRange,
  findClosestEnemyInRange,
  updateEnemyPosition,
  updateProjectilePosition,
  checkProjectileHit,
  canPlaceTower,
  generateId,
} from './gameLogic';
import type { Enemy, Tower, Projectile, Position } from '../types/game';

describe('gameLogic', () => {
  describe('distance', () => {
    it('should calculate distance between two points correctly', () => {
      const pos1: Position = { x: 0, y: 0 };
      const pos2: Position = { x: 3, y: 4 };
      expect(distance(pos1, pos2)).toBe(5);
    });

    it('should return 0 for same position', () => {
      const pos: Position = { x: 10, y: 20 };
      expect(distance(pos, pos)).toBe(0);
    });

    it('should calculate distance with negative coordinates', () => {
      const pos1: Position = { x: -3, y: -4 };
      const pos2: Position = { x: 0, y: 0 };
      expect(distance(pos1, pos2)).toBe(5);
    });

    it('should handle decimal coordinates', () => {
      const pos1: Position = { x: 1.5, y: 2.5 };
      const pos2: Position = { x: 4.5, y: 6.5 };
      expect(distance(pos1, pos2)).toBe(5);
    });
  });

  describe('isEnemyInRange', () => {
    let tower: Tower;
    let enemy: Enemy;

    beforeEach(() => {
      tower = {
        id: 'tower-1',
        position: { x: 100, y: 100 },
        level: 1,
        damage: 10,
        range: 50,
        fireRate: 1,
        lastFireTime: 0,
        cost: 50,
      };

      enemy = {
        id: 'enemy-1',
        position: { x: 130, y: 100 },
        health: 100,
        maxHealth: 100,
        speed: 50,
        level: 1,
        pathIndex: 0,
        reward: 20,
      };
    });

    it('should return true when enemy is within range', () => {
      expect(isEnemyInRange(tower, enemy)).toBe(true);
    });

    it('should return false when enemy is out of range', () => {
      enemy.position = { x: 200, y: 100 };
      expect(isEnemyInRange(tower, enemy)).toBe(false);
    });

    it('should return true when enemy is exactly at range boundary', () => {
      enemy.position = { x: 150, y: 100 };
      expect(isEnemyInRange(tower, enemy)).toBe(true);
    });

    it('should work with diagonal positions', () => {
      enemy.position = { x: 130, y: 140 }; // distance = 50
      expect(isEnemyInRange(tower, enemy)).toBe(true);
    });
  });

  describe('findClosestEnemyInRange', () => {
    let tower: Tower;

    beforeEach(() => {
      tower = {
        id: 'tower-1',
        position: { x: 100, y: 100 },
        level: 1,
        damage: 10,
        range: 100,
        fireRate: 1,
        lastFireTime: 0,
        cost: 50,
      };
    });

    it('should find the closest enemy in range', () => {
      const enemies: Enemy[] = [
        {
          id: 'enemy-1',
          position: { x: 150, y: 100 },
          health: 100,
          maxHealth: 100,
          speed: 50,
          level: 1,
          pathIndex: 0,
          reward: 20,
        },
        {
          id: 'enemy-2',
          position: { x: 120, y: 100 },
          health: 100,
          maxHealth: 100,
          speed: 50,
          level: 1,
          pathIndex: 0,
          reward: 20,
        },
      ];

      const closest = findClosestEnemyInRange(tower, enemies);
      expect(closest?.id).toBe('enemy-2');
    });

    it('should return null when no enemies are in range', () => {
      const enemies: Enemy[] = [
        {
          id: 'enemy-1',
          position: { x: 300, y: 300 },
          health: 100,
          maxHealth: 100,
          speed: 50,
          level: 1,
          pathIndex: 0,
          reward: 20,
        },
      ];

      expect(findClosestEnemyInRange(tower, enemies)).toBeNull();
    });

    it('should return null when enemies array is empty', () => {
      expect(findClosestEnemyInRange(tower, [])).toBeNull();
    });

    it('should handle multiple enemies at different distances', () => {
      const enemies: Enemy[] = [
        {
          id: 'enemy-far',
          position: { x: 180, y: 100 },
          health: 100,
          maxHealth: 100,
          speed: 50,
          level: 1,
          pathIndex: 0,
          reward: 20,
        },
        {
          id: 'enemy-close',
          position: { x: 110, y: 100 },
          health: 100,
          maxHealth: 100,
          speed: 50,
          level: 1,
          pathIndex: 0,
          reward: 20,
        },
        {
          id: 'enemy-out',
          position: { x: 300, y: 300 },
          health: 100,
          maxHealth: 100,
          speed: 50,
          level: 1,
          pathIndex: 0,
          reward: 20,
        },
      ];

      const closest = findClosestEnemyInRange(tower, enemies);
      expect(closest?.id).toBe('enemy-close');
    });
  });

  describe('updateEnemyPosition', () => {
    const path: Position[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];

    it('should move enemy towards next waypoint', () => {
      const enemy: Enemy = {
        id: 'enemy-1',
        position: { x: 0, y: 0 },
        health: 100,
        maxHealth: 100,
        speed: 50,
        level: 1,
        pathIndex: 0,
        reward: 20,
      };

      const result = updateEnemyPosition(enemy, path, 1000);
      
      expect(result.position.x).toBeGreaterThan(0);
      expect(result.position.y).toBe(0);
      expect(result.pathIndex).toBe(0);
      expect(result.reachedEnd).toBe(false);
    });

    it('should advance to next waypoint when reached', () => {
      const enemy: Enemy = {
        id: 'enemy-1',
        position: { x: 95, y: 0 },
        health: 100,
        maxHealth: 100,
        speed: 100,
        level: 1,
        pathIndex: 0,
        reward: 20,
      };

      const result = updateEnemyPosition(enemy, path, 1000);
      
      expect(result.position.x).toBe(100);
      expect(result.position.y).toBe(0);
      expect(result.pathIndex).toBe(1);
    });

    it('should set reachedEnd to true when reaching final waypoint', () => {
      const enemy: Enemy = {
        id: 'enemy-1',
        position: { x: 100, y: 95 },
        health: 100,
        maxHealth: 100,
        speed: 100,
        level: 1,
        pathIndex: 1,
        reward: 20,
      };

      const result = updateEnemyPosition(enemy, path, 1000);
      
      expect(result.reachedEnd).toBe(true);
    });

    it('should handle enemy already at end', () => {
      const enemy: Enemy = {
        id: 'enemy-1',
        position: { x: 100, y: 100 },
        health: 100,
        maxHealth: 100,
        speed: 50,
        level: 1,
        pathIndex: 2,
        reward: 20,
      };

      const result = updateEnemyPosition(enemy, path, 1000);
      
      expect(result.position).toEqual(enemy.position);
      expect(result.pathIndex).toBe(2);
      expect(result.reachedEnd).toBe(true);
    });

    it('should move proportionally based on deltaTime', () => {
      const enemy: Enemy = {
        id: 'enemy-1',
        position: { x: 0, y: 0 },
        health: 100,
        maxHealth: 100,
        speed: 100,
        level: 1,
        pathIndex: 0,
        reward: 20,
      };

      const result1 = updateEnemyPosition(enemy, path, 500);
      const result2 = updateEnemyPosition(enemy, path, 1000);
      
      expect(result2.position.x).toBeGreaterThan(result1.position.x);
    });
  });

  describe('updateProjectilePosition', () => {
    it('should move projectile towards target', () => {
      const projectile: Projectile = {
        id: 'proj-1',
        position: { x: 0, y: 0 },
        targetEnemyId: 'enemy-1',
        damage: 10,
        speed: 300,
      };
      const targetPosition: Position = { x: 100, y: 0 };

      const newPosition = updateProjectilePosition(projectile, targetPosition, 100);
      
      expect(newPosition.x).toBeGreaterThan(0);
      expect(newPosition.x).toBeLessThan(100);
      expect(newPosition.y).toBe(0);
    });

    it('should reach target when close enough', () => {
      const projectile: Projectile = {
        id: 'proj-1',
        position: { x: 95, y: 0 },
        targetEnemyId: 'enemy-1',
        damage: 10,
        speed: 300,
      };
      const targetPosition: Position = { x: 100, y: 0 };

      const newPosition = updateProjectilePosition(projectile, targetPosition, 100);
      
      expect(newPosition).toEqual(targetPosition);
    });

    it('should handle diagonal movement', () => {
      const projectile: Projectile = {
        id: 'proj-1',
        position: { x: 0, y: 0 },
        targetEnemyId: 'enemy-1',
        damage: 10,
        speed: 300,
      };
      const targetPosition: Position = { x: 100, y: 100 };

      const newPosition = updateProjectilePosition(projectile, targetPosition, 100);
      
      expect(newPosition.x).toBeGreaterThan(0);
      expect(newPosition.y).toBeGreaterThan(0);
      expect(newPosition.x).toBeCloseTo(newPosition.y);
    });

    it('should not move when already at target', () => {
      const targetPosition: Position = { x: 100, y: 100 };
      const projectile: Projectile = {
        id: 'proj-1',
        position: { ...targetPosition },
        targetEnemyId: 'enemy-1',
        damage: 10,
        speed: 300,
      };

      const newPosition = updateProjectilePosition(projectile, targetPosition, 100);
      
      expect(newPosition).toEqual(targetPosition);
    });
  });

  describe('checkProjectileHit', () => {
    it('should return true when projectile hits enemy', () => {
      const projectile: Projectile = {
        id: 'proj-1',
        position: { x: 100, y: 100 },
        targetEnemyId: 'enemy-1',
        damage: 10,
        speed: 300,
      };
      const enemy: Enemy = {
        id: 'enemy-1',
        position: { x: 105, y: 100 },
        health: 100,
        maxHealth: 100,
        speed: 50,
        level: 1,
        pathIndex: 0,
        reward: 20,
      };

      expect(checkProjectileHit(projectile, enemy)).toBe(true);
    });

    it('should return false when projectile misses enemy', () => {
      const projectile: Projectile = {
        id: 'proj-1',
        position: { x: 100, y: 100 },
        targetEnemyId: 'enemy-1',
        damage: 10,
        speed: 300,
      };
      const enemy: Enemy = {
        id: 'enemy-1',
        position: { x: 150, y: 100 },
        health: 100,
        maxHealth: 100,
        speed: 50,
        level: 1,
        pathIndex: 0,
        reward: 20,
      };

      expect(checkProjectileHit(projectile, enemy)).toBe(false);
    });

    it('should return true when at exact hit radius', () => {
      const projectile: Projectile = {
        id: 'proj-1',
        position: { x: 100, y: 100 },
        targetEnemyId: 'enemy-1',
        damage: 10,
        speed: 300,
      };
      const enemy: Enemy = {
        id: 'enemy-1',
        position: { x: 114, y: 100 },
        health: 100,
        maxHealth: 100,
        speed: 50,
        level: 1,
        pathIndex: 0,
        reward: 20,
      };

      expect(checkProjectileHit(projectile, enemy)).toBe(true);
    });
  });

  describe('canPlaceTower', () => {
    const path: Position[] = [
      { x: 50, y: 50 },
      { x: 200, y: 50 },
      { x: 200, y: 200 },
    ];

    it('should allow placing tower in empty space', () => {
      const position: Position = { x: 100, y: 150 };
      const towers: Tower[] = [];

      expect(canPlaceTower(position, towers, path)).toBe(true);
    });

    it('should not allow placing tower too close to existing tower', () => {
      const position: Position = { x: 100, y: 150 };
      const towers: Tower[] = [
        {
          id: 'tower-1',
          position: { x: 110, y: 150 },
          level: 1,
          damage: 10,
          range: 50,
          fireRate: 1,
          lastFireTime: 0,
          cost: 50,
        },
      ];

      expect(canPlaceTower(position, towers, path)).toBe(false);
    });

    it('should not allow placing tower on the path', () => {
      const position: Position = { x: 100, y: 50 };
      const towers: Tower[] = [];

      expect(canPlaceTower(position, towers, path)).toBe(false);
    });

    it('should not allow placing tower too close to path', () => {
      const position: Position = { x: 100, y: 60 };
      const towers: Tower[] = [];

      expect(canPlaceTower(position, towers, path)).toBe(false);
    });

    it('should allow placing tower far from path and other towers', () => {
      const position: Position = { x: 100, y: 150 };
      const towers: Tower[] = [
        {
          id: 'tower-1',
          position: { x: 300, y: 300 },
          level: 1,
          damage: 10,
          range: 50,
          fireRate: 1,
          lastFireTime: 0,
          cost: 50,
        },
      ];

      expect(canPlaceTower(position, towers, path)).toBe(true);
    });

    it('should handle custom tower size', () => {
      const position: Position = { x: 100, y: 150 };
      const towers: Tower[] = [
        {
          id: 'tower-1',
          position: { x: 120, y: 150 },
          level: 1,
          damage: 10,
          range: 50,
          fireRate: 1,
          lastFireTime: 0,
          cost: 50,
        },
      ];

      expect(canPlaceTower(position, towers, path, 10)).toBe(true);
      expect(canPlaceTower(position, towers, path, 50)).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate string IDs', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });
});
