import type { Enemy, Position, Projectile, FireProjectile, IceProjectile, LaserBeam, ElectricChain, FlameStream, IceStream } from '../../types/game';
import { GAME_SETTINGS } from '../../config/settings';
import { distance } from './math';

/**
 * Логика снарядов и эффектов
 */

export function updateProjectilePosition(
  projectile: Projectile,
  targetPosition: Position,
  deltaTime: number
): Position {
  const dx = targetPosition.x - projectile.position.x;
  const dy = targetPosition.y - projectile.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return projectile.position;

  const moveDistance = (projectile.speed * deltaTime) / 1000;
  
  if (dist <= moveDistance) {
    return targetPosition;
  }

  const ratio = moveDistance / dist;
  return {
    x: projectile.position.x + dx * ratio,
    y: projectile.position.y + dy * ratio,
  };
}

export function checkProjectileHit(
  projectile: Projectile,
  enemy: Enemy,
  hitRadius: number = GAME_SETTINGS.PROJECTILE_HIT_RADIUS
): boolean {
  const dist = distance(projectile.position, enemy.position);
  return dist < hitRadius;
}

export interface ProcessedProjectiles {
  activeProjectiles: Projectile[];
  updatedEnemies: Enemy[];
}

export function processProjectiles(
  projectiles: Projectile[],
  enemies: Enemy[],
  deltaTime: number
): ProcessedProjectiles {
  const activeProjectiles: Projectile[] = [];
  const enemiesMap = new Map(enemies.map((e) => [e.id, { ...e }]));

  for (const projectile of projectiles) {
    const target = enemiesMap.get(projectile.targetEnemyId);

    if (!target) continue;

    const newPosition = updateProjectilePosition(projectile, target.position, deltaTime);

    if (checkProjectileHit({ ...projectile, position: newPosition }, target)) {
      target.health -= projectile.damage;
    } else {
      activeProjectiles.push({
        ...projectile,
        position: newPosition,
      });
    }
  }

  return {
    activeProjectiles,
    updatedEnemies: Array.from(enemiesMap.values()),
  };
}

// ============================================
// Логика огненных снарядов
// ============================================

export interface ProcessedFireProjectiles {
  activeFireProjectiles: FireProjectile[];
  updatedEnemies: Enemy[];
}

export function processFireProjectiles(
  fireProjectiles: FireProjectile[],
  enemies: Enemy[],
  deltaTime: number
): ProcessedFireProjectiles {
  const activeFireProjectiles: FireProjectile[] = [];
  const enemiesMap = new Map(enemies.map((e) => [e.id, { ...e }]));

  for (const projectile of fireProjectiles) {
    const target = enemiesMap.get(projectile.targetEnemyId);

    if (!target) continue;

    const newPosition = updateProjectilePosition(
      { ...projectile, speed: projectile.speed } as any,
      target.position,
      deltaTime
    );

    if (checkProjectileHit({ position: newPosition } as any, target)) {
      // Огненный снаряд наносит урон по области
      for (const enemy of enemiesMap.values()) {
        const dist = distance(target.position, enemy.position);
        if (dist <= projectile.areaRadius) {
          enemy.health -= projectile.damage;
        }
      }
    } else {
      activeFireProjectiles.push({
        ...projectile,
        position: newPosition,
      });
    }
  }

  return {
    activeFireProjectiles,
    updatedEnemies: Array.from(enemiesMap.values()),
  };
}

// ============================================
// Логика потоков огня
// ============================================

export interface ProcessedFlameStreams {
  activeFlameStreams: FlameStream[];
  updatedEnemies: Enemy[];
}

export function processFlameStreams(
  flameStreams: FlameStream[],
  enemies: Enemy[],
  currentTime: number
): ProcessedFlameStreams {
  const activeFlameStreams: FlameStream[] = [];
  const enemiesMap = new Map(enemies.map((e) => [e.id, { ...e }]));

  for (const stream of flameStreams) {
    // Поток огня существует только один кадр
    const duration = currentTime - stream.startTime;
    if (duration > GAME_SETTINGS.FLAME_STREAM_DURATION) continue;

    activeFlameStreams.push(stream);
  }

  return {
    activeFlameStreams,
    updatedEnemies: Array.from(enemiesMap.values()),
  };
}

// ============================================
// Логика ледяных снарядов
// ============================================

export interface ProcessedIceProjectiles {
  activeIceProjectiles: IceProjectile[];
  updatedEnemies: Enemy[];
}

export function processIceProjectiles(
  iceProjectiles: IceProjectile[],
  enemies: Enemy[],
  deltaTime: number
): ProcessedIceProjectiles {
  const activeIceProjectiles: IceProjectile[] = [];
  const enemiesMap = new Map(enemies.map((e) => [e.id, { ...e }]));

  for (const projectile of iceProjectiles) {
    const target = enemiesMap.get(projectile.targetEnemyId);

    if (!target) continue;

    const newPosition = updateProjectilePosition(
      { ...projectile, speed: projectile.speed } as any,
      target.position,
      deltaTime
    );

    if (checkProjectileHit({ position: newPosition } as any, target)) {
      // Ледяной снаряд наносит урон и замедляет
      target.health -= projectile.damage;
      target.slowEffect = projectile.slowEffect;
    } else {
      activeIceProjectiles.push({
        ...projectile,
        position: newPosition,
      });
    }
  }

  return {
    activeIceProjectiles,
    updatedEnemies: Array.from(enemiesMap.values()),
  };
}

// ============================================
// Логика потоков льда
// ============================================

export interface ProcessedIceStreams {
  activeIceStreams: IceStream[];
  updatedEnemies: Enemy[];
}

export function processIceStreams(
  iceStreams: IceStream[],
  enemies: Enemy[],
  currentTime: number
): ProcessedIceStreams {
  const activeIceStreams: IceStream[] = [];
  const enemiesMap = new Map(enemies.map((e) => [e.id, { ...e }]));

  for (const stream of iceStreams) {
    // Поток льда существует только один кадр
    const duration = currentTime - stream.startTime;
    if (duration > GAME_SETTINGS.ICE_STREAM_DURATION) continue;

    activeIceStreams.push(stream);
  }

  return {
    activeIceStreams,
    updatedEnemies: Array.from(enemiesMap.values()),
  };
}

// ============================================
// Логика электрических разрядов
// ============================================

export interface ProcessedElectricChains {
  activeElectricChains: ElectricChain[];
  updatedEnemies: Enemy[];
}

export function processElectricChains(
  electricChains: ElectricChain[],
  enemies: Enemy[],
  currentTime: number,
  chainDuration: number = GAME_SETTINGS.ELECTRIC_CHAIN_DURATION
): ProcessedElectricChains {
  const activeElectricChains: ElectricChain[] = [];
  const enemiesMap = new Map(enemies.map((e) => [e.id, { ...e }]));

  for (const chain of electricChains) {
    const chainAge = currentTime - chain.startTime;

    if (chainAge > chainDuration) {
      continue;
    }

    const allTargetsExist = chain.targetEnemyIds.every(id => enemiesMap.has(id));
    if (allTargetsExist) {
      activeElectricChains.push(chain);
    }
  }

  return {
    activeElectricChains,
    updatedEnemies: Array.from(enemiesMap.values()),
  };
}

// ============================================
// Логика лазерных лучей
// ============================================

export interface ProcessedLaserBeams {
  activeLaserBeams: LaserBeam[];
  updatedEnemies: Enemy[];
}

export function processLaserBeams(
  laserBeams: LaserBeam[],
  enemies: Enemy[],
  currentTime: number,
  beamDuration: number = GAME_SETTINGS.LASER_BEAM_DURATION
): ProcessedLaserBeams {
  const activeLaserBeams: LaserBeam[] = [];
  const enemiesMap = new Map(enemies.map((e) => [e.id, { ...e }]));

  for (const beam of laserBeams) {
    const beamAge = currentTime - beam.startTime;

    if (beamAge > beamDuration) {
      continue;
    }

    const target = enemiesMap.get(beam.targetEnemyId);

    if (target) {
      activeLaserBeams.push(beam);
    }
  }

  return {
    activeLaserBeams,
    updatedEnemies: Array.from(enemiesMap.values()),
  };
}
