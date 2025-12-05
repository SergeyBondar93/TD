import type { Position } from "../../types/game";

/**
 * Математические утилиты для игры
 */

export function distance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceToSegment(
  point: Position,
  a: Position,
  b: Position
): number {
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

// Функция для плавной интерполяции угла (учитывает переход через 0/2π)
export function lerpAngle(
  current: number,
  target: number,
  speed: number,
  deltaTime: number
): number {
  // Нормализуем углы в диапазон [0, 2π]
  const normalizeAngle = (angle: number) => {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
  };

  const currentNorm = normalizeAngle(current);
  const targetNorm = normalizeAngle(target);

  // Вычисляем кратчайший путь поворота
  let diff = targetNorm - currentNorm;
  if (diff > Math.PI) {
    diff -= Math.PI * 2;
  } else if (diff < -Math.PI) {
    diff += Math.PI * 2;
  }

  // Интерполируем
  const maxRotation = speed * (deltaTime / 1000);
  if (Math.abs(diff) <= maxRotation) {
    return targetNorm;
  }

  return normalizeAngle(currentNorm + Math.sign(diff) * maxRotation);
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
