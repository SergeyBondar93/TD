import type { Enemy, Tower, Projectile, Position, WaveConfig, LaserBeam, ElectricChain, FireProjectile, IceProjectile } from '../types/game';
import { ENEMY_SIZES, WeaponType as WeaponTypeEnum } from '../types/game';

/**
 * Чистая игровая логика - функции без побочных эффектов
 * Все функции принимают данные и возвращают новые данные
 * Никакой зависимости от React или state management
 */

// ============================================
// Математические утилиты
// ============================================

export function distance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceToSegment(point: Position, a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return distance(point, a);
  }

  let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const projection = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };

  return distance(point, projection);
}

// ============================================
// ID генерация
// ============================================

let idCounter = 0;
export function generateId(): string {
  return `${Date.now()}-${idCounter++}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

// ============================================
// Логика врагов
// ============================================

export interface EnemyUpdateResult {
  position: Position;
  pathIndex: number;
  reachedEnd: boolean;
  turnPoints?: Position[];
}

export function updateEnemyPosition(
  enemy: Enemy,
  path: Position[],
  deltaTime: number
): EnemyUpdateResult {
  if (enemy.pathIndex >= path.length - 1) {
    return { 
      position: enemy.position, 
      pathIndex: enemy.pathIndex, 
      reachedEnd: true 
    };
  }

  const currentTarget = path[enemy.pathIndex + 1];
  const currentPos = path[enemy.pathIndex];
  
  // Вычисляем направление движения
  const dx = currentTarget.x - currentPos.x;
  const dy = currentTarget.y - currentPos.y;
  const pathLength = Math.sqrt(dx * dx + dy * dy);
  
  // Нормализуем направление
  const dirX = dx / pathLength;
  const dirY = dy / pathLength;
  
  // Применяем эффект замедления от ледяного оружия
  const effectiveSpeed = enemy.speed * (1 - (enemy.slowEffect || 0));
  
  // Перпендикулярное направление (для смещения)
  const perpX = -dirY;
  const perpY = dirX;
  
  // Определяем направление поворота к следующей точке
  let offsetSign = 1;
  if (enemy.pathIndex + 2 < path.length) {
    const nextTarget = path[enemy.pathIndex + 2];
    const nextDx = nextTarget.x - currentTarget.x;
    const nextDy = nextTarget.y - currentTarget.y;
    
    // Векторное произведение показывает направление поворота
    // Если > 0 - поворот налево, если < 0 - направо
    const cross = dirX * nextDy - dirY * nextDx;
    offsetSign = cross > 0 ? -1 : 1;
  }
  
  // Целевая позиция с учетом смещения
  const targetX = currentTarget.x + perpX * enemy.pathOffset + dirX * enemy.pathOffset * offsetSign;
  const targetY = currentTarget.y + perpY * enemy.pathOffset + dirY * enemy.pathOffset * offsetSign;
  
  const distX = targetX - enemy.position.x;
  const distY = targetY - enemy.position.y;
  const dist = Math.sqrt(distX * distX + distY * distY);

  const moveDistance = (effectiveSpeed * deltaTime) / 1000;

  if (dist <= moveDistance) {
    // Враг достиг точки пути - это поворот
    const turnPoints = enemy.turnPoints || [];
    turnPoints.push({ x: targetX, y: targetY });
    
    return {
      position: { x: targetX, y: targetY },
      pathIndex: enemy.pathIndex + 1,
      reachedEnd: enemy.pathIndex + 1 >= path.length - 1,
      turnPoints,
    };
  } else {
    const ratio = moveDistance / dist;
    return {
      position: {
        x: enemy.position.x + distX * ratio,
        y: enemy.position.y + distY * ratio,
      },
      pathIndex: enemy.pathIndex,
      reachedEnd: false,
    };
  }
}

export interface ProcessedEnemies {
  activeEnemies: Enemy[];
  lostLives: number;
  earnedMoney: number;
}

export function processEnemies(
  enemies: Enemy[],
  path: Position[],
  deltaTime: number
): ProcessedEnemies {
  const activeEnemies: Enemy[] = [];
  let lostLives = 0;
  let earnedMoney = 0;

  for (const enemy of enemies) {
    if (enemy.health <= 0) {
      earnedMoney += enemy.reward;
      continue;
    }

    const updated = updateEnemyPosition(enemy, path, deltaTime);
    if (updated.reachedEnd) {
      lostLives++;
    } else {
      activeEnemies.push({
        ...enemy,
        position: updated.position,
        pathIndex: updated.pathIndex,
        turnPoints: updated.turnPoints || enemy.turnPoints,
      });
    }
  }

  return { activeEnemies, lostLives, earnedMoney };
}

// ============================================
// Логика башен
// ============================================

export function isEnemyInRange(tower: Tower, enemy: Enemy): boolean {
  const dist = distance(tower.position, enemy.position);
  return dist <= tower.range;
}

export function findClosestEnemyInRange(
  tower: Tower,
  enemies: Enemy[]
): Enemy | null {
  let closestEnemy: Enemy | null = null;
  let minDistance = Infinity;

  for (const enemy of enemies) {
    if (isEnemyInRange(tower, enemy)) {
      const dist = distance(tower.position, enemy.position);
      if (dist < minDistance) {
        minDistance = dist;
        closestEnemy = enemy;
      }
    }
  }

  return closestEnemy;
}

// Находит цепочку врагов для электрического оружия
export function findEnemyChain(
  startEnemy: Enemy,
  enemies: Enemy[],
  maxChainCount: number,
  chainRange: number = 100
): Enemy[] {
  const chain: Enemy[] = [startEnemy];
  const used = new Set<string>([startEnemy.id]);

  for (let i = 0; i < maxChainCount - 1; i++) {
    const lastEnemy = chain[chain.length - 1];
    let nearestEnemy: Enemy | null = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
      if (used.has(enemy.id)) continue;

      const dist = distance(lastEnemy.position, enemy.position);
      if (dist <= chainRange && dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }

    if (!nearestEnemy) break;

    chain.push(nearestEnemy);
    used.add(nearestEnemy.id);
  }

  return chain;
}

export function canPlaceTower(
  position: Position,
  towers: Tower[],
  path: Position[],
  towerSize: number = 35
): boolean {
  // Проверяем, что башни не накладываются друг на друга (можно ставить впритык)
  for (const tower of towers) {
    if (distance(position, tower.position) < towerSize) {
      return false;
    }
  }

  // Проверяем, что башня не на дороге
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    
    const dist = distanceToSegment(position, p1, p2);
    if (dist < towerSize) {
      return false;
    }
  }

  return true;
}

export interface TowerFireResult {
  updatedTower: Tower;
  projectile: Projectile | null;
  laserBeam: LaserBeam | null;
  electricChain: ElectricChain | null;
  fireProjectile: FireProjectile | null;
  iceProjectile: IceProjectile | null;
}

export function processTowerFire(
  tower: Tower,
  enemies: Enemy[],
  currentTime: number
): TowerFireResult {
  const timeSinceLastFire = currentTime - tower.lastFireTime;
  const fireInterval = 1000 / tower.fireRate;

  if (timeSinceLastFire < fireInterval) {
    return { updatedTower: tower, projectile: null, laserBeam: null, electricChain: null, fireProjectile: null, iceProjectile: null };
  }

  const target = findClosestEnemyInRange(tower, enemies);

  if (!target) {
    return { updatedTower: { ...tower, currentTarget: undefined }, projectile: null, laserBeam: null, electricChain: null, fireProjectile: null, iceProjectile: null };
  }

  const updatedTower = { ...tower, lastFireTime: currentTime, currentTarget: target.id };

  // Электрическое оружие - цепная молния
  if (tower.weaponType === WeaponTypeEnum.ELECTRIC) {
    const chainCount = tower.chainCount || 3;
    const enemyChain = findEnemyChain(target, enemies, chainCount);

    const electricChain: ElectricChain = {
      id: generateId(),
      towerId: tower.id,
      targetEnemyIds: enemyChain.map(e => e.id),
      damage: tower.damage,
      startTime: currentTime,
      chainCount: enemyChain.length,
    };

    return {
      updatedTower,
      projectile: null,
      laserBeam: null,
      electricChain,
      fireProjectile: null,
      iceProjectile: null,
    };
  }

  // Лазерное оружие - мгновенный урон
  if (tower.weaponType === WeaponTypeEnum.LASER) {
    const laserBeam: LaserBeam = {
      id: generateId(),
      towerId: tower.id,
      targetEnemyId: target.id,
      damage: tower.damage,
      startTime: currentTime,
    };

    return {
      updatedTower,
      projectile: null,
      laserBeam,
      electricChain: null,
      fireProjectile: null,
      iceProjectile: null,
    };
  }

  // Огненное оружие - снаряд с областью поражения
  if (tower.weaponType === WeaponTypeEnum.FIRE) {
    const fireProjectile: FireProjectile = {
      id: generateId(),
      position: { ...tower.position },
      targetEnemyId: target.id,
      damage: tower.damage,
      speed: 250,
      areaRadius: tower.areaRadius || 40,
    };

    return {
      updatedTower,
      projectile: null,
      laserBeam: null,
      electricChain: null,
      fireProjectile,
      iceProjectile: null,
    };
  }

  // Ледяное оружие - снаряд с замедлением
  if (tower.weaponType === WeaponTypeEnum.ICE) {
    const iceProjectile: IceProjectile = {
      id: generateId(),
      position: { ...tower.position },
      targetEnemyId: target.id,
      damage: tower.damage,
      speed: 280,
      slowEffect: tower.slowEffect || 0.2,
      slowDuration: tower.slowDuration || 2000,
    };

    return {
      updatedTower,
      projectile: null,
      laserBeam: null,
      electricChain: null,
      fireProjectile: null,
      iceProjectile,
    };
  }

  // Снарядное оружие
  const projectile: Projectile = {
    id: generateId(),
    position: { ...tower.position },
    targetEnemyId: target.id,
    damage: tower.damage,
    speed: 300,
  };

  return {
    updatedTower,
    projectile,
    laserBeam: null,
    electricChain: null,
    fireProjectile: null,
    iceProjectile: null,
  };
}

// ============================================
// Логика снарядов
// ============================================

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
  hitRadius: number = 15
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
  chainDuration: number = 150 // Длительность визуализации цепи в мс
): ProcessedElectricChains {
  const activeElectricChains: ElectricChain[] = [];
  const enemiesMap = new Map(enemies.map((e) => [e.id, { ...e }]));
  const damagedChains = new Set<string>();

  for (const chain of electricChains) {
    const chainAge = currentTime - chain.startTime;

    // Удаляем старые цепи
    if (chainAge > chainDuration) {
      continue;
    }

    // Применяем урон только один раз за цепь
    if (!damagedChains.has(chain.id)) {
      for (const enemyId of chain.targetEnemyIds) {
        const enemy = enemiesMap.get(enemyId);
        if (enemy) {
          enemy.health -= chain.damage;
        }
      }
      damagedChains.add(chain.id);
    }

    // Оставляем цепь активной для визуализации
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
  beamDuration: number = 100 // Длительность лазерного луча в мс
): ProcessedLaserBeams {
  const activeLaserBeams: LaserBeam[] = [];
  const enemiesMap = new Map(enemies.map((e) => [e.id, { ...e }]));
  const damagedEnemies = new Set<string>();

  for (const beam of laserBeams) {
    const beamAge = currentTime - beam.startTime;

    // Удаляем старые лучи
    if (beamAge > beamDuration) {
      continue;
    }

    const target = enemiesMap.get(beam.targetEnemyId);

    // Применяем урон только один раз за луч
    if (target && !damagedEnemies.has(target.id)) {
      target.health -= beam.damage;
      damagedEnemies.add(target.id);
    }

    // Оставляем луч активным для визуализации
    if (target) {
      activeLaserBeams.push(beam);
    }
  }

  return {
    activeLaserBeams,
    updatedEnemies: Array.from(enemiesMap.values()),
  };
}

// ============================================
// Логика волн
// ============================================

export interface WaveSpawnState {
  waveIndex: number;
  enemiesSpawned: number;
  lastSpawnTime: number;
}

export interface SpawnResult {
  newEnemy: Enemy | null;
  updatedSpawnState: WaveSpawnState | null;
}

export function processWaveSpawn(
  spawnState: WaveSpawnState | null,
  waveConfig: WaveConfig,
  currentTime: number,
  startPosition: Position
): SpawnResult {
  if (!spawnState) {
    return { newEnemy: null, updatedSpawnState: null };
  }

  const timeSinceLastSpawn = currentTime - spawnState.lastSpawnTime;

  if (
    spawnState.enemiesSpawned < waveConfig.enemyCount &&
    timeSinceLastSpawn >= waveConfig.spawnDelay
  ) {
    // Определяем размер врага в зависимости от типа
    const enemySize = ENEMY_SIZES[waveConfig.enemyType];
    
    // Для пехоты добавляем случайное смещение (перпендикулярно и вдоль пути)
    let spawnPosition = { ...startPosition };
    let pathOffset = 0;
    
    if (waveConfig.enemyType === 'infantry') {
      // Смещение от -20 до +20 пикселей для создания эффекта толпы
      pathOffset =  (Math.random() - 0.5) * 40;
      // Смещение применяется как перпендикулярно, так и вдоль направления движения
      spawnPosition.x += pathOffset;
      spawnPosition.y += pathOffset;
    }
    const newEnemy: Enemy = {
      id: generateId(),
      position: spawnPosition,
      health: waveConfig.enemyHealth,
      maxHealth: waveConfig.enemyHealth,
      speed: waveConfig.enemySpeed,
      level: waveConfig.enemyLevel,
      pathIndex: 0,
      reward: waveConfig.enemyReward,
      type: waveConfig.enemyType,
      size: enemySize,
      pathOffset: pathOffset,
      turnPoints: [],
    };

    const updatedSpawnState: WaveSpawnState = {
      ...spawnState,
      enemiesSpawned: spawnState.enemiesSpawned + 1,
      lastSpawnTime: currentTime,
    };

    // Если все враги заспавнились, возвращаем null
    const finalSpawnState = 
      updatedSpawnState.enemiesSpawned >= waveConfig.enemyCount 
        ? null 
        : updatedSpawnState;

    return { newEnemy, updatedSpawnState: finalSpawnState };
  }

  return { newEnemy: null, updatedSpawnState: spawnState };
}
