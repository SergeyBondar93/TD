import type { Enemy, Position } from '../../types/game';

/**
 * Логика врагов
 */

export interface EnemyUpdateResult {
  position: Position;
  pathIndex: number;
  reachedEnd: boolean;
  turnPoints?: Position[];
  rotation?: number;
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

  // Вычисляем угол направления движения
  const rotation = Math.atan2(distY, distX);

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
      rotation,
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
      rotation,
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
    // Если враг умер и НЕ начал анимацию смерти - инициализируем её
    if (enemy.health <= 0 && !enemy.isDying) {
      activeEnemies.push({
        ...enemy,
        isDying: true,
        deathStartTime: Date.now() / 1000 // в секундах
      });
      earnedMoney += enemy.reward;
      continue;
    }

    // Если враг в процессе анимации смерти - оставляем его на месте без движения
    if (enemy.isDying) {
      activeEnemies.push(enemy); // Враг остаётся на месте
      continue;
    }

    // Враг жив - обрабатываем движение
    const updated = updateEnemyPosition(enemy, path, deltaTime);
    if (updated.reachedEnd) {
      lostLives++;
    } else {
      activeEnemies.push({
        ...enemy,
        position: updated.position,
        pathIndex: updated.pathIndex,
        turnPoints: updated.turnPoints || enemy.turnPoints,
        rotation: updated.rotation ?? enemy.rotation ?? 0,
      });
    }
  }

  return { activeEnemies, lostLives, earnedMoney };
}
