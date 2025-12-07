import type {
  Enemy,
  Tower,
  Position,
  Projectile,
  LaserBeam,
  ElectricChain,
  FireProjectile,
  FlameStream,
  IceProjectile,
  IceStream,
} from "../../types/game";
import { WeaponType as WeaponTypeEnum } from "../../types/game";
import { GAME_SETTINGS } from "../../config/settings";
import { TOWER_STATS } from "../../config/gameData/towers";
import { distance, distanceToSegment, generateId } from "./math";

/**
 * Логика башен
 */

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
    // Игнорируем умирающих врагов
    if (enemy.isDying) {
      continue;
    }

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
  chainRange: number = GAME_SETTINGS.ELECTRIC_CHAIN_RANGE
): Enemy[] {
  const chain: Enemy[] = [startEnemy];
  const used = new Set<string>([startEnemy.id]);

  for (let i = 0; i < maxChainCount - 1; i++) {
    const lastEnemy = chain[chain.length - 1];
    let nearestEnemy: Enemy | null = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
      if (used.has(enemy.id)) continue;

      // Игнорируем умирающих врагов
      if (enemy.isDying) continue;

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

export function findEnemiesInCone(
  towerPosition: Position,
  targetPosition: Position,
  enemies: Enemy[],
  range: number,
  coneAngle: number // угол в градусах
): Enemy[] {
  const dx = targetPosition.x - towerPosition.x;
  const dy = targetPosition.y - towerPosition.y;
  const targetAngle = Math.atan2(dy, dx);
  const coneAngleRad = (coneAngle * Math.PI) / 180;

  return enemies.filter((enemy) => {
    // Игнорируем умирающих врагов
    if (enemy.isDying) return false;

    const dist = distance(towerPosition, enemy.position);
    if (dist > range) return false;

    const ex = enemy.position.x - towerPosition.x;
    const ey = enemy.position.y - towerPosition.y;
    const enemyAngle = Math.atan2(ey, ex);

    // Вычисляем разницу углов
    let angleDiff = Math.abs(enemyAngle - targetAngle);
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff;
    }

    return angleDiff <= coneAngleRad / 2;
  });
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

/**
 * Рассчитывает стоимость продажи башни (70% от вложенных средств)
 */
export function calculateTowerSellValue(tower: Tower): number {
  // Рассчитываем стоимость завершенных улучшений
  const completedUpgrades = Array.from(
    { length: tower.upgradeLevel },
    (_, i) => {
      const stats = TOWER_STATS[tower.level][i + 1];
      return stats?.upgradeCost ?? 0;
    }
  ).reduce((sum, cost) => sum + cost, 0);

  // Рассчитываем стоимость улучшений в очереди
  const queuedUpgrades = Array.from(
    { length: tower.upgradeQueue || 0 },
    (_, i) => {
      const stats = TOWER_STATS[tower.level][tower.upgradeLevel + i + 1];
      return stats?.upgradeCost ?? 0;
    }
  ).reduce((sum, cost) => sum + cost, 0);

  // Общая инвестиция = базовая стоимость + завершенные + в очереди
  const totalInvested = tower.cost + completedUpgrades + queuedUpgrades;
  return Math.round(totalInvested * 0.7);
}

export interface TowerFireResult {
  updatedTower: Tower;
  updatedEnemies: Enemy[];
  projectiles: Projectile[];
  laserBeams: LaserBeam[];
  electricChains: ElectricChain[];
  fireProjectiles: FireProjectile[];
  flameStreams: FlameStream[];
  iceProjectiles: IceProjectile[];
  iceStreams: IceStream[];
}

export function processTowerFire(
  tower: Tower,
  enemies: Enemy[],
  currentTime: number
): TowerFireResult {
  const projectiles: Projectile[] = [];
  const laserBeams: LaserBeam[] = [];
  const electricChains: ElectricChain[] = [];
  const fireProjectiles: FireProjectile[] = [];
  const flameStreams: FlameStream[] = [];
  const iceProjectiles: IceProjectile[] = [];
  const iceStreams: IceStream[] = [];

  // Создаем копии врагов для модификации (не мутируем оригинальный массив)
  const enemiesMap = new Map(enemies.map((e) => [e.id, { ...e }]));

  // Башня не может атаковать во время строительства или улучшения
  if (tower.buildTimeRemaining > 0) {
    return {
      updatedTower: tower,
      updatedEnemies: Array.from(enemiesMap.values()),
      projectiles,
      laserBeams,
      electricChains,
      fireProjectiles,
      flameStreams,
      iceProjectiles,
      iceStreams,
    };
  }

  const fireInterval = 1000 / tower.fireRate;
  let timeSinceLastFire = currentTime - tower.lastFireTime;

  if (timeSinceLastFire < fireInterval) {
    return {
      updatedTower: tower,
      updatedEnemies: Array.from(enemiesMap.values()),
      projectiles,
      laserBeams,
      electricChains,
      fireProjectiles,
      flameStreams,
      iceProjectiles,
      iceStreams,
    };
  }

  // Вычисляем сколько выстрелов должно быть за это время
  const shotsToFire = Math.floor(timeSinceLastFire / fireInterval);
  let updatedTower = tower;

  // Проверяем цель и поворот ОДИН РАЗ перед всеми выстрелами
  const target = findClosestEnemyInRange(
    updatedTower,
    Array.from(enemiesMap.values())
  );

  if (!target) {
    return {
      updatedTower: { ...updatedTower, currentTarget: undefined },
      updatedEnemies: Array.from(enemiesMap.values()),
      projectiles,
      laserBeams,
      electricChains,
      fireProjectiles,
      flameStreams,
      iceProjectiles,
      iceStreams,
    };
  }

  // Вычисляем целевой угол поворота к цели
  const dx = target.position.x - updatedTower.position.x;
  const dy = target.position.y - updatedTower.position.y;
  const targetRotation = Math.atan2(dy, dx);

  // Проверяем, повернулась ли башня достаточно близко к цели
  const currentRotation = updatedTower.rotation ?? 0;

  let angleDiff = targetRotation - currentRotation;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  // Если башня не довернулась, обновляем targetRotation без выстрела
  if (Math.abs(angleDiff) > GAME_SETTINGS.TOWER_ROTATION_THRESHOLD) {
    updatedTower = {
      ...updatedTower,
      currentTarget: target.id,
      targetRotation,
    };
    return {
      updatedTower,
      updatedEnemies: Array.from(enemiesMap.values()),
      projectiles,
      laserBeams,
      electricChains,
      fireProjectiles,
      flameStreams,
      iceProjectiles,
      iceStreams,
    };
  }

  // Стреляем несколько раз, если прошло достаточно времени
  // ВАЖНО: Сначала наносим весь урон, потом создаем визуальные эффекты

  // 1. НАНОСИМ УРОН за все выстрелы (без визуализации)
  const totalDamage = updatedTower.damage * shotsToFire;

  // Обновляем lastFireTime на все выстрелы сразу
  const finalShotTime = tower.lastFireTime + fireInterval * shotsToFire;
  updatedTower = {
    ...updatedTower,
    lastFireTime: finalShotTime,
    currentTarget: target.id,
    targetRotation,
  };

  // 2. Ограничиваем визуальные эффекты для производительности
  const visualEffectInterval =
    1000 / GAME_SETTINGS.MAX_VISUAL_EFFECTS_PER_SECOND;
  const visualShotsToShow = Math.min(
    shotsToFire,
    Math.max(1, Math.floor(timeSinceLastFire / visualEffectInterval))
  );

  // Наносим урон в зависимости от типа оружия
  if (updatedTower.weaponType === WeaponTypeEnum.ELECTRIC) {
    const chainCount = updatedTower.chainCount || 3;
    const enemyChain = findEnemyChain(
      target,
      Array.from(enemiesMap.values()),
      chainCount
    );

    // Наносим урон всем врагам в цепи (используем enemiesMap для правильного обновления)
    for (const chainEnemy of enemyChain) {
      const enemyInMap = enemiesMap.get(chainEnemy.id);
      if (enemyInMap) {
        enemyInMap.health -= totalDamage;
      }
    }

    // Создаем визуальные эффекты (ограниченное количество)
    for (let i = 0; i < visualShotsToShow; i++) {
      const shotTime = tower.lastFireTime + fireInterval * (i + 1);
      electricChains.push({
        id: generateId(),
        towerId: updatedTower.id,
        targetEnemyIds: enemyChain.map((e) => e.id),
        damage: 0,
        startTime: shotTime,
        chainCount: updatedTower.chainCount || 3,
      });
    }
  } else if (updatedTower.weaponType === WeaponTypeEnum.LASER) {
    const targetInMap = enemiesMap.get(target.id);
    if (targetInMap) {
      targetInMap.health -= totalDamage;
    }

    for (let i = 0; i < visualShotsToShow; i++) {
      const shotTime = tower.lastFireTime + fireInterval * (i + 1);
      laserBeams.push({
        id: generateId(),
        towerId: updatedTower.id,
        targetEnemyId: target.id,
        damage: 0,
        startTime: shotTime,
      });
    }
  } else if (updatedTower.weaponType === WeaponTypeEnum.FIRE) {
    const enemiesInCone = findEnemiesInCone(
      updatedTower.position,
      target.position,
      Array.from(enemiesMap.values()),
      updatedTower.range,
      updatedTower.areaRadius || 60
    );

    for (const coneEnemy of enemiesInCone) {
      const enemyInMap = enemiesMap.get(coneEnemy.id);
      if (enemyInMap) {
        enemyInMap.health -= totalDamage;
      }
    }

    for (let i = 0; i < visualShotsToShow; i++) {
      const shotTime = tower.lastFireTime + fireInterval * (i + 1);
      flameStreams.push({
        id: generateId(),
        towerId: updatedTower.id,
        targetEnemyIds: enemiesInCone.map((e) => e.id),
        damage: 0,
        startTime: shotTime,
        range: updatedTower.range,
      });
    }
  } else if (updatedTower.weaponType === WeaponTypeEnum.ICE) {
    const enemiesInCone = findEnemiesInCone(
      updatedTower.position,
      target.position,
      Array.from(enemiesMap.values()),
      updatedTower.range,
      updatedTower.areaRadius || 50
    );

    for (const coneEnemy of enemiesInCone) {
      const enemyInMap = enemiesMap.get(coneEnemy.id);
      if (enemyInMap) {
        enemyInMap.health -= totalDamage;
        enemyInMap.slowEffect = updatedTower.slowEffect || 0.35;
      }
    }

    for (let i = 0; i < visualShotsToShow; i++) {
      const shotTime = tower.lastFireTime + fireInterval * (i + 1);
      iceStreams.push({
        id: generateId(),
        towerId: updatedTower.id,
        targetEnemyIds: enemiesInCone.map((e) => e.id),
        damage: 0,
        slowEffect: updatedTower.slowEffect || 0.35,
        slowDuration: updatedTower.slowDuration || 3000,
        startTime: shotTime,
        range: updatedTower.range,
      });
    }
  } else {
    // Снарядное оружие
    for (let i = 0; i < visualShotsToShow; i++) {
      projectiles.push({
        id: generateId(),
        position: { ...updatedTower.position },
        targetEnemyId: target.id,
        speed: GAME_SETTINGS.PROJECTILE_SPEED,
        damage: updatedTower.damage,
      });
    }
  }

  return {
    updatedTower,
    updatedEnemies: Array.from(enemiesMap.values()),
    projectiles,
    laserBeams,
    electricChains,
    fireProjectiles,
    flameStreams,
    iceProjectiles,
    iceStreams,
  };
}
