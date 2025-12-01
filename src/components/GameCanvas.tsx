import React, { useRef, useEffect, useState } from 'react';
import type { GameState, Enemy, Tower, Projectile } from '../types/game';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_PADDING,
  GAME_WIDTH,
  GAME_HEIGHT,
  ENEMY_SIZE,
  TOWER_SIZE,
  PROJECTILE_SIZE,
  TOWER_STATS,
} from '../types/game';
import { DEV_CONFIG } from '../config/dev';
import { canPlaceTower } from '../utils/pureGameLogic';

interface GameCanvasProps {
  gameState: GameState;
  onCanvasClick: (x: number, y: number) => void;
  selectedTowerLevel: 1 | 2 | 3 | null;
  path: { x: number; y: number }[];
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onCanvasClick, selectedTowerLevel, path }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистка canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Заливка игрового поля
    ctx.fillStyle = '#16213e';
    ctx.fillRect(CANVAS_PADDING, CANVAS_PADDING, GAME_WIDTH, GAME_HEIGHT);

    // Рисуем путь
    drawPath(ctx, gameState.path);

    // Рисуем границу игрового поля поверх всего
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 2;
    ctx.strokeRect(CANVAS_PADDING, CANVAS_PADDING, GAME_WIDTH, GAME_HEIGHT);

    // Рисуем башни
    gameState.towers.forEach((tower) => drawTower(ctx, tower));

    // Рисуем врагов
    gameState.enemies.forEach((enemy) => drawEnemy(ctx, enemy));

    // Рисуем снаряды
    gameState.projectiles.forEach((projectile) => drawProjectile(ctx, projectile));

    // Отладочная информация на canvas
    if (DEV_CONFIG.SHOW_DEBUG_INFO) {
      ctx.fillStyle = '#0f0';
      ctx.font = '14px monospace';
      ctx.fillText(`Enemies: ${gameState.enemies.length}`, CANVAS_PADDING + 10, CANVAS_PADDING + 20);
      ctx.fillText(`Towers: ${gameState.towers.length}`, CANVAS_PADDING + 10, CANVAS_PADDING + 40);
      ctx.fillText(`Wave: ${gameState.currentWave}`, CANVAS_PADDING + 10, CANVAS_PADDING + 60);
    }

    // Координаты углов игрового поля
    if (DEV_CONFIG.SHOW_COORDINATES) {
      ctx.fillStyle = '#ff0';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`(${CANVAS_PADDING}, ${CANVAS_PADDING})`, CANVAS_PADDING + 5, CANVAS_PADDING + 15);
      ctx.fillText(`(${CANVAS_PADDING + GAME_WIDTH}, ${CANVAS_PADDING})`, CANVAS_PADDING + GAME_WIDTH - 80, CANVAS_PADDING + 15);
      ctx.fillText(`(${CANVAS_PADDING}, ${CANVAS_PADDING + GAME_HEIGHT})`, CANVAS_PADDING + 5, CANVAS_PADDING + GAME_HEIGHT - 5);
      ctx.fillText(`(${CANVAS_PADDING + GAME_WIDTH}, ${CANVAS_PADDING + GAME_HEIGHT})`, CANVAS_PADDING + GAME_WIDTH - 95, CANVAS_PADDING + GAME_HEIGHT - 5);
    }

    // Рисуем превью башни при выборе
    if (selectedTowerLevel && mousePos) {
      drawTowerPreview(ctx, mousePos, selectedTowerLevel, gameState.towers, path);
    }
  }, [gameState, selectedTowerLevel, mousePos, path]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onCanvasClick(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTowerLevel) {
      setMousePos(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        border: '2px solid #0f3460',
        cursor: selectedTowerLevel ? 'crosshair' : 'default',
        display: 'block',
      }}
    />
  );
};

// Рисование пути
function drawPath(ctx: CanvasRenderingContext2D, path: { x: number; y: number }[]) {
  if (path.length < 2) return;

  ctx.strokeStyle = '#2a4a6e';
  ctx.lineWidth = 40;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);

  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }

  ctx.stroke();

  // Рисуем точки пути
  ctx.fillStyle = '#0f3460';
  path.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Координаты каждой точки пути
    if (DEV_CONFIG.SHOW_PATH_COORDINATES) {
      ctx.fillStyle = '#f0f';
      ctx.font = '11px monospace';
      ctx.fillText(`(${point.x}, ${point.y})`, point.x + 10, point.y - 10);
    }
    
    // Номер точки
    if (index === 0) {
      ctx.fillStyle = '#0f0';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('START', point.x + 10, point.y + 15);
    }
    if (index === path.length - 1) {
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('END', point.x + 10, point.y + 15);
    }
    ctx.fillStyle = '#0f3460';
  });
}

// Рисование врага (квадратик с уровнем и HP)
function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const size = enemy.size;
  const x = enemy.position.x - size / 2;
  const y = enemy.position.y - size / 2;

  // Определяем цвет в зависимости от типа врага
  const color = enemy.type === 'infantry' ? '#ff6b6b' : '#4a90e2';
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);

  // Обводка
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  // Уровень врага в центре квадрата
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(enemy.level.toString(), enemy.position.x, enemy.position.y);

  // HP полоска над врагом
  const healthBarWidth = size;
  const healthBarHeight = 4;
  const healthBarX = x;
  const healthBarY = y - 10;

  // Фон HP
  ctx.fillStyle = '#333';
  ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

  // Текущий HP
  const healthPercent = enemy.health / enemy.maxHealth;
  ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
  ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);

  // Текст HP над полоской
  ctx.fillStyle = '#fff';
  ctx.font = '10px Arial';
  ctx.fillText(
    `${Math.ceil(enemy.health)}/${enemy.maxHealth}`,
    enemy.position.x,
    healthBarY - 6
  );

  // Координаты под врагом
  ctx.fillStyle = '#0ff';
  ctx.font = '9px monospace';
  ctx.fillText(
    `(${Math.round(enemy.position.x)}, ${Math.round(enemy.position.y)})`,
    enemy.position.x,
    y + size + 12
  );
}

// Рисование башни (квадратик с уровнем)
function drawTower(ctx: CanvasRenderingContext2D, tower: Tower) {
  const size = tower.size;
  const x = tower.position.x - size / 2;
  const y = tower.position.y - size / 2;

  // Цвет башни в зависимости от уровня
  const colors = {
    1: '#4ecdc4',
    2: '#44a5e8',
    3: '#9b59b6',
  };
  ctx.fillStyle = colors[tower.level];
  ctx.fillRect(x, y, size, size);

  // Обводка
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  // Уровень башни
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tower.level.toString(), tower.position.x, tower.position.y);

  // Радиус атаки (полупрозрачный круг)
  ctx.strokeStyle = colors[tower.level];
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Рисование снаряда
function drawProjectile(ctx: CanvasRenderingContext2D, projectile: Projectile) {
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.arc(
    projectile.position.x,
    projectile.position.y,
    PROJECTILE_SIZE,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Обводка
  ctx.strokeStyle = '#ff9800';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Рисование превью башни при размещении
function drawTowerPreview(
  ctx: CanvasRenderingContext2D,
  position: { x: number; y: number },
  towerLevel: 1 | 2 | 3,
  existingTowers: Tower[],
  path: { x: number; y: number }[]
) {
  const towerStats = TOWER_STATS[towerLevel];
  const canPlace = canPlaceTower(position, existingTowers, path);
  
  const size = towerStats.size;
  const x = position.x - size / 2;
  const y = position.y - size / 2;

  // Цвета башни в зависимости от уровня
  const colors = {
    1: '#4ecdc4',
    2: '#44a5e8',
    3: '#9b59b6',
  };

  // Рисуем радиус действия
  ctx.strokeStyle = canPlace ? colors[towerLevel] : '#ff0000';
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(position.x, position.y, towerStats.range, 0, Math.PI * 2);
  ctx.stroke();
  
  // Заливка круга радиуса
  ctx.fillStyle = canPlace ? colors[towerLevel] : '#ff0000';
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.arc(position.x, position.y, towerStats.range, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Рисуем саму башню
  ctx.fillStyle = canPlace ? colors[towerLevel] : '#ff0000';
  ctx.globalAlpha = canPlace ? 0.6 : 0.5;
  ctx.fillRect(x, y, size, size);
  ctx.globalAlpha = 1;

  // Обводка башни
  ctx.strokeStyle = canPlace ? '#000' : '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  // Уровень башни
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(towerLevel.toString(), position.x, position.y);

  // Показываем текст "нельзя поставить" если позиция недопустима
  if (!canPlace) {
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('НЕЛЬЗЯ', position.x, position.y + size / 2 + 15);
  }
}
