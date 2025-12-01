import type { Enemy, Tower, Projectile, Position } from '../types/game';

// Вычисление расстояния между двумя точками
export function distance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Проверка, находится ли враг в радиусе действия башни
export function isEnemyInRange(tower: Tower, enemy: Enemy): boolean {
  const dist = distance(tower.position, enemy.position);
  return dist <= tower.range;
}

// Найти ближайшего врага в радиусе действия башни
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

// Обновление позиции врага по пути
export function updateEnemyPosition(
  enemy: Enemy,
  path: Position[],
  deltaTime: number
): { position: Position; pathIndex: number; reachedEnd: boolean } {
  if (enemy.pathIndex >= path.length - 1) {
    return { position: enemy.position, pathIndex: enemy.pathIndex, reachedEnd: true };
  }

  const currentTarget = path[enemy.pathIndex + 1];
  const dx = currentTarget.x - enemy.position.x;
  const dy = currentTarget.y - enemy.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const moveDistance = (enemy.speed * deltaTime) / 1000; // скорость в пикселях/сек

  if (dist <= moveDistance) {
    // Достигли следующей точки пути
    return {
      position: currentTarget,
      pathIndex: enemy.pathIndex + 1,
      reachedEnd: enemy.pathIndex + 1 >= path.length - 1,
    };
  } else {
    // Движемся к следующей точке
    const ratio = moveDistance / dist;
    return {
      position: {
        x: enemy.position.x + dx * ratio,
        y: enemy.position.y + dy * ratio,
      },
      pathIndex: enemy.pathIndex,
      reachedEnd: false,
    };
  }
}

// Обновление позиции снаряда к цели
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

// Проверка столкновения снаряда с врагом
export function checkProjectileHit(
  projectile: Projectile,
  enemy: Enemy
): boolean {
  const dist = distance(projectile.position, enemy.position);
  return dist < 15; // Радиус попадания
}

// Генерация уникального ID
let idCounter = 0;
export function generateId(): string {
  return `${Date.now()}-${idCounter++}`;
}

// Проверка, можно ли поставить башню в данную позицию
export function canPlaceTower(
  position: Position,
  towers: Tower[],
  path: Position[],
  towerSize: number = 35
): boolean {
  // Проверяем, не пересекается ли с другими башнями
  for (const tower of towers) {
    if (distance(position, tower.position) < towerSize * 1.5) {
      return false;
    }
  }

  // Проверяем, не на пути ли
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    
    // Проверяем расстояние от точки до отрезка пути
    const dist = distanceToSegment(position, p1, p2);
    if (dist < towerSize) {
      return false;
    }
  }

  return true;
}

// Расстояние от точки до отрезка
function distanceToSegment(point: Position, a: Position, b: Position): number {
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
