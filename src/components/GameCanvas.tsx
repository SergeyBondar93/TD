import React, { useRef, useEffect, useState } from 'react';
import type { GameState, Enemy, Tower, Projectile } from '../types/game';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_PADDING,
  GAME_WIDTH,
  GAME_HEIGHT,
  PROJECTILE_SIZE,
  TOWER_STATS,
  EnemyType,
  WeaponType,
} from '../types/game';
import { DEV_CONFIG } from '../config/dev';
import { canPlaceTower } from '../utils/pureGameLogic';
import { getEnemy3DManager } from './Enemy3DRenderer';

interface GameCanvasProps {
  gameState: GameState;
  onCanvasClick: (x: number, y: number) => void;
  onTowerClick: (towerId: string) => void;
  selectedTowerLevel: 1 | 2 | 3 | 4 | 5 | null;
  path: { x: number; y: number }[];
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onCanvasClick, onTowerClick, selectedTowerLevel, path }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const enemy3DManagerRef = useRef(getEnemy3DManager());
  const lastFrameTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Вычисляем deltaTime для анимации
    const now = Date.now();
    const deltaTime = (now - lastFrameTimeRef.current) / 1000; // в секундах
    lastFrameTimeRef.current = now;

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
    gameState.enemies.forEach((enemy) => drawEnemy(ctx, enemy, deltaTime, enemy3DManagerRef.current, gameState.gameSpeed));

    // Рисуем снаряды
    gameState.projectiles.forEach((projectile) => drawProjectile(ctx, projectile));

    // Рисуем огненные снаряды (старые, если есть)
    gameState.fireProjectiles?.forEach((fireProj) => drawFireProjectile(ctx, fireProj));

    // Рисуем потоки огня (огнемет)
    gameState.flameStreams?.forEach((stream) => 
      drawFlameStream(ctx, stream, gameState.towers, gameState.enemies)
    );

    // Рисуем ледяные снаряды (старые, если есть)
    gameState.iceProjectiles?.forEach((iceProj) => drawIceProjectile(ctx, iceProj));

    // Рисуем потоки льда
    gameState.iceStreams?.forEach((stream) => 
      drawIceStream(ctx, stream, gameState.towers, gameState.enemies)
    );

    // Рисуем лазерные лучи
    gameState.laserBeams?.forEach((laser) => {
      const tower = gameState.towers.find(t => t.id === laser.towerId);
      const enemy = gameState.enemies.find(e => e.id === laser.targetEnemyId);
      if (tower && enemy) {
        drawLaserBeam(ctx, tower.position, enemy.position);
      }
    });

    // Рисуем электрические разряды
    gameState.electricChains?.forEach((chain) => {
      const tower = gameState.towers.find(t => t.id === chain.towerId);
      const chainEnemies = chain.targetEnemyIds
        .map(id => gameState.enemies.find(e => e.id === id))
        .filter((e): e is Enemy => e !== undefined);
      
      if (tower && chainEnemies.length > 0) {
        drawElectricChain(ctx, tower.position, chainEnemies.map(e => e.position));
      }
    });

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
      ctx.fillText(`X: ${CANVAS_PADDING}, Y: ${CANVAS_PADDING}`, CANVAS_PADDING + 5, CANVAS_PADDING + 15);
      ctx.fillText(`X: ${CANVAS_PADDING + GAME_WIDTH}, Y: ${CANVAS_PADDING}`, CANVAS_PADDING + GAME_WIDTH - 100, CANVAS_PADDING + 15);
      ctx.fillText(`X: ${CANVAS_PADDING}, Y: ${CANVAS_PADDING + GAME_HEIGHT}`, CANVAS_PADDING + 5, CANVAS_PADDING + GAME_HEIGHT - 5);
      ctx.fillText(`X: ${CANVAS_PADDING + GAME_WIDTH}, Y: ${CANVAS_PADDING + GAME_HEIGHT}`, CANVAS_PADDING + GAME_WIDTH - 120, CANVAS_PADDING + GAME_HEIGHT - 5);
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

    // Проверяем клик по башне
    for (const tower of gameState.towers) {
      const dx = x - tower.position.x;
      const dy = y - tower.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= tower.size / 2) {
        onTowerClick(tower.id);
        return;
      }
    }

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

// Рисование врага (3D модель)
function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, deltaTime: number, enemy3DManager: ReturnType<typeof getEnemy3DManager>, gameSpeed: number) {
  const size = enemy.size;
  const x = enemy.position.x - size / 2;
  const y = enemy.position.y - size / 2;

  // Рендерим 3D модель
  const isLoaded = enemy3DManager.isLoaded();
  
  if (isLoaded && enemy.modelConfig) {
    // Создаём или получаем модель для этого врага
    enemy3DManager.getOrCreateEnemy(enemy.id, enemy.modelConfig);
    
    // Если ЭТОТ конкретный враг начал умирать - запускаем анимацию смерти
    if (enemy.isDying && enemy.deathStartTime) {
      const is3DDying = enemy3DManager.isEnemyDying(enemy.id);
      if (!is3DDying) {
        // Передаем направление движения в момент смерти
        enemy3DManager.startDeathAnimation(enemy.id, enemy.deathStartTime, enemy.rotation);
      }
    }
    
    const rotation = enemy.rotation ?? 0;
    const modelCanvas = enemy3DManager.render(enemy.id, rotation, deltaTime, gameSpeed);
    
    if (modelCanvas) {
      // Рисуем 3D модель на игровом canvas
      ctx.save();
      ctx.drawImage(modelCanvas, x, y, size, size);
      ctx.restore();
    } else {
      console.log('[drawEnemy] Model loaded but render returned null for enemy:', enemy.id);
      // Fallback - рисуем квадратик
      const color = enemy.type === EnemyType.INFANTRY ? '#ff6b6b' : '#4a90e2';
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, size, size);
    }
  } else {
    // Запасной вариант: рисуем квадратик пока модель не загрузилась
    const color = enemy.type === EnemyType.INFANTRY ? '#ff6b6b' : '#4a90e2';
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    
    // Обводка
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
  }

  // Уровень врага в центре квадрата (не показываем для уровней до 10)
  if (DEV_CONFIG.SHOW_ENEMY_LEVEL && enemy.level >= 10) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.level.toString(), enemy.position.x, enemy.position.y);
  }

  // HP полоска над врагом (не показываем для умирающих)
  if (enemy.isDying) {
    return; // Не рисуем HP бар для умирающих врагов
  }
  
  const healthBarWidth = size;
  const healthBarHeight = 4;
  const healthBarX = x;
  const healthBarY = y - 10;

  // Фон HP
  ctx.fillStyle = '#333';
  ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

  // Текущий HP (ограничиваем от 0 до 1)
  const healthPercent = Math.max(0, Math.min(1, enemy.health / enemy.maxHealth));
  ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
  ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);

  // Текст HP над полоской (скрываем для пехоты если включен флаг)
  const isInfantry = enemy.type === 'infantry';
  const shouldHideHP = DEV_CONFIG.HIDE_INFANTRY_HP && isInfantry;
  
  if (!shouldHideHP) {
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.fillText(
      `${Math.ceil(enemy.health)}/${enemy.maxHealth}`,
      enemy.position.x,
      healthBarY - 6
    );
  }

  // Координаты под врагом (скрываем для пехоты если включен флаг)
  if (!shouldHideHP) {
    ctx.fillStyle = '#0ff';
    ctx.font = '9px monospace';
    ctx.fillText(
      `(${Math.round(enemy.position.x)}, ${Math.round(enemy.position.y)})`,
      enemy.position.x,
      y + size + 12
    );
  }
}

// Рисование башни (квадратик с уровнем)
function drawTower(ctx: CanvasRenderingContext2D, tower: Tower) {
  const size = tower.size;
  const x = tower.position.x - size / 2;
  const y = tower.position.y - size / 2;

  // Цвет башни в зависимости от уровня и типа оружия
  const colors: Record<number, string> = {
    1: '#4ecdc4',
    2: '#44a5e8',
    3: '#9b59b6',
    4: '#e67e22',
    5: '#3498db',
  };
  
  // Особый вид для лазерных башен
  if (tower.weaponType === WeaponType.LASER) {
    // Рисуем основание лазерной башни
    ctx.fillStyle = colors[tower.level];
    ctx.fillRect(x, y, size, size);
    
    // Добавляем визуальный элемент лазера
    ctx.fillStyle = '#ff0000';
    const laserSize = size * 0.4;
    const laserX = tower.position.x - laserSize / 2;
    const laserY = tower.position.y - laserSize / 2;
    ctx.fillRect(laserX, laserY, laserSize, laserSize);
    
    // Обводка внутреннего элемента
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 1;
    ctx.strokeRect(laserX, laserY, laserSize, laserSize);
  } else if (tower.weaponType === WeaponType.ELECTRIC) {
    // Рисуем основание электрической башни
    ctx.fillStyle = colors[tower.level];
    ctx.fillRect(x, y, size, size);
    
    // Добавляем визуальный элемент молнии
    ctx.fillStyle = '#00ffff';
    const electricSize = size * 0.5;
    
    // Рисуем зигзаг
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tower.position.x - electricSize/3, tower.position.y - electricSize/3);
    ctx.lineTo(tower.position.x, tower.position.y);
    ctx.lineTo(tower.position.x + electricSize/3, tower.position.y + electricSize/3);
    ctx.stroke();
    
    // Добавляем свечение
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (tower.weaponType === WeaponType.FIRE) {
    // Рисуем основание огненной башни
    ctx.fillStyle = colors[tower.level];
    ctx.fillRect(x, y, size, size);
    
    // Добавляем визуальный элемент огня
    const gradient = ctx.createRadialGradient(
      tower.position.x, tower.position.y, 0,
      tower.position.x, tower.position.y, size * 0.4
    );
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(0.5, '#ff6600');
    gradient.addColorStop(1, '#ff0000');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(tower.position.x, tower.position.y, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Эффект пламени
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff6600';
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (tower.weaponType === WeaponType.ICE) {
    // Рисуем основание ледяной башни
    ctx.fillStyle = colors[tower.level];
    ctx.fillRect(x, y, size, size);
    
    // Добавляем визуальный элемент льда
    ctx.fillStyle = '#a0d8ff';
    const iceSize = size * 0.5;
    
    // Рисуем снежинку
    ctx.strokeStyle = '#d0f0ff';
    ctx.lineWidth = 2;
    const centerX = tower.position.x;
    const centerY = tower.position.y;
    const radius = iceSize / 2;
    
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.stroke();
    }
    
    // Эффект свечения
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#a0d8ff';
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    // Обычная башня со снарядами
    ctx.fillStyle = colors[tower.level];
    ctx.fillRect(x, y, size, size);
  }

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

  // Индикатор строительства/улучшения
  if (tower.buildTimeRemaining > 0) {
    // Вычисляем общее время всех обновлений/постройки
    const singleUpgradeTime = DEV_CONFIG.BASE_UPGRADE_TIME * 1000;
    let totalTime: number;
    
    if (tower.upgradeQueue > 0) {
      // Для обновлений: общее время = количество обновлений * время одного
      totalTime = singleUpgradeTime * tower.upgradeQueue;
    } else {
      // Для постройки: используем полное время постройки
      totalTime = DEV_CONFIG.BASE_BUILD_TIME * 1000 * tower.level;
    }
    
    // Прогресс = сколько времени уже прошло от общего
    const timeElapsed = totalTime - tower.buildTimeRemaining;
    const progress = timeElapsed / totalTime;
    
    // Полупрозрачный серый оверлей
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y, size, size);
    
    // Прогресс-бар
    const barHeight = 4;
    const barY = y + size + 5;
    
    // Фон бара
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x, barY, size, barHeight);
    
    // Заполнение бара
    ctx.fillStyle = tower.upgradeQueue > 0 ? '#ffd700' : '#4ecdc4';
    ctx.fillRect(x, barY, size * progress, barHeight);
    
    // Обводка бара
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, barY, size, barHeight);
  }

  // Радиус атаки (полупрозрачный круг)
  ctx.strokeStyle = colors[tower.level];
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Рисуем стрелку направления
  const rotation = tower.rotation ?? 0;
  const arrowLength = size * 0.6;
  const arrowWidth = size * 0.25;
  
  ctx.save();
  ctx.translate(tower.position.x, tower.position.y);
  ctx.rotate(rotation);
  
  // Стрелка
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(arrowLength, 0); // Кончик стрелки
  ctx.lineTo(0, -arrowWidth);
  ctx.lineTo(0, arrowWidth);
  ctx.closePath();
  ctx.fill();
  
  // Обводка стрелки
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  ctx.globalAlpha = 1;
  ctx.restore();
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

// Рисование огненного снаряда
function drawFireProjectile(ctx: CanvasRenderingContext2D, projectile: any) {
  // Основной огненный шар
  const gradient = ctx.createRadialGradient(
    projectile.position.x, projectile.position.y, 0,
    projectile.position.x, projectile.position.y, PROJECTILE_SIZE * 1.5
  );
  gradient.addColorStop(0, '#ffff00');
  gradient.addColorStop(0.4, '#ff6600');
  gradient.addColorStop(1, '#ff0000');
  
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(
    projectile.position.x,
    projectile.position.y,
    PROJECTILE_SIZE * 1.2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Внутреннее ядро
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(
    projectile.position.x,
    projectile.position.y,
    PROJECTILE_SIZE * 0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Эффект пламени
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ff6600';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// Рисование потока огня (огнемет)
function drawFlameStream(ctx: CanvasRenderingContext2D, stream: any, towers: any[], enemies: any[]) {
  const tower = towers.find(t => t.id === stream.towerId);
  if (!tower) return;

  // Находим направление к центру целей
  const targetEnemies = enemies.filter(e => stream.targetEnemyIds.includes(e.id));
  if (targetEnemies.length === 0) return;

  // Вычисляем центр целей
  let centerX = 0;
  let centerY = 0;
  for (const enemy of targetEnemies) {
    centerX += enemy.position.x;
    centerY += enemy.position.y;
  }
  centerX /= targetEnemies.length;
  centerY /= targetEnemies.length;

  const dx = centerX - tower.position.x;
  const dy = centerY - tower.position.y;
  const angle = Math.atan2(dy, dx);
  const coneAngle = (tower.areaRadius || 60) * Math.PI / 180;

  // Рисуем конус пламени
  ctx.save();
  ctx.globalAlpha = 0.6;

  // Градиент от башни к дальности
  const gradient = ctx.createLinearGradient(
    tower.position.x,
    tower.position.y,
    tower.position.x + Math.cos(angle) * stream.range,
    tower.position.y + Math.sin(angle) * stream.range
  );
  gradient.addColorStop(0, '#ff6600');
  gradient.addColorStop(0.3, '#ff9900');
  gradient.addColorStop(0.7, '#ffaa00');
  gradient.addColorStop(1, 'rgba(255, 200, 0, 0.1)');

  ctx.fillStyle = gradient;

  // Рисуем конус
  ctx.beginPath();
  ctx.moveTo(tower.position.x, tower.position.y);
  
  const leftAngle = angle - coneAngle / 2;
  const rightAngle = angle + coneAngle / 2;
  
  ctx.lineTo(
    tower.position.x + Math.cos(leftAngle) * stream.range,
    tower.position.y + Math.sin(leftAngle) * stream.range
  );
  
  ctx.arc(
    tower.position.x,
    tower.position.y,
    stream.range,
    leftAngle,
    rightAngle
  );
  
  ctx.lineTo(tower.position.x, tower.position.y);
  ctx.fill();

  // Добавляем эффект "живого" пламени с несколькими слоями
  for (let i = 0; i < 3; i++) {
    const particleAngle = angle + (Math.random() - 0.5) * coneAngle;
    const distance = stream.range * (0.3 + Math.random() * 0.7);
    
    const particleGradient = ctx.createRadialGradient(
      tower.position.x + Math.cos(particleAngle) * distance,
      tower.position.y + Math.sin(particleAngle) * distance,
      0,
      tower.position.x + Math.cos(particleAngle) * distance,
      tower.position.y + Math.sin(particleAngle) * distance,
      30
    );
    particleGradient.addColorStop(0, '#ffff00');
    particleGradient.addColorStop(0.5, '#ff6600');
    particleGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = particleGradient;
    ctx.globalAlpha = 0.3 + Math.random() * 0.3;
    ctx.beginPath();
    ctx.arc(
      tower.position.x + Math.cos(particleAngle) * distance,
      tower.position.y + Math.sin(particleAngle) * distance,
      20 + Math.random() * 10,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

// Рисование потока льда
function drawIceStream(ctx: CanvasRenderingContext2D, stream: any, towers: any[], enemies: any[]) {
  const tower = towers.find(t => t.id === stream.towerId);
  if (!tower) return;

  // Находим направление к центру целей
  const targetEnemies = enemies.filter(e => stream.targetEnemyIds.includes(e.id));
  if (targetEnemies.length === 0) return;

  // Вычисляем центр целей
  let centerX = 0;
  let centerY = 0;
  for (const enemy of targetEnemies) {
    centerX += enemy.position.x;
    centerY += enemy.position.y;
  }
  centerX /= targetEnemies.length;
  centerY /= targetEnemies.length;

  const dx = centerX - tower.position.x;
  const dy = centerY - tower.position.y;
  const angle = Math.atan2(dy, dx);
  const coneAngle = (tower.areaRadius || 50) * Math.PI / 180;

  // Рисуем конус льда
  ctx.save();
  ctx.globalAlpha = 0.5;

  // Градиент от башни к дальности (голубой → прозрачный)
  const gradient = ctx.createLinearGradient(
    tower.position.x,
    tower.position.y,
    tower.position.x + Math.cos(angle) * stream.range,
    tower.position.y + Math.sin(angle) * stream.range
  );
  gradient.addColorStop(0, '#a0d8ff');
  gradient.addColorStop(0.3, '#c0e8ff');
  gradient.addColorStop(0.7, '#d0f0ff');
  gradient.addColorStop(1, 'rgba(200, 240, 255, 0.1)');

  ctx.fillStyle = gradient;

  // Рисуем конус
  ctx.beginPath();
  ctx.moveTo(tower.position.x, tower.position.y);
  
  const leftAngle = angle - coneAngle / 2;
  const rightAngle = angle + coneAngle / 2;
  
  ctx.lineTo(
    tower.position.x + Math.cos(leftAngle) * stream.range,
    tower.position.y + Math.sin(leftAngle) * stream.range
  );
  
  ctx.arc(
    tower.position.x,
    tower.position.y,
    stream.range,
    leftAngle,
    rightAngle
  );
  
  ctx.lineTo(tower.position.x, tower.position.y);
  ctx.fill();

  // Добавляем ледяные кристаллы
  for (let i = 0; i < 5; i++) {
    const particleAngle = angle + (Math.random() - 0.5) * coneAngle;
    const distance = stream.range * (0.3 + Math.random() * 0.7);
    
    const x = tower.position.x + Math.cos(particleAngle) * distance;
    const y = tower.position.y + Math.sin(particleAngle) * distance;
    
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6 + Math.random() * 0.3;
    
    // Рисуем снежинку
    const size = 4 + Math.random() * 4;
    for (let j = 0; j < 6; j++) {
      const starAngle = (j * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(starAngle) * size,
        y + Math.sin(starAngle) * size
      );
      ctx.strokeStyle = '#d0f0ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.restore();
}

// Рисование ледяного снаряда
function drawIceProjectile(ctx: CanvasRenderingContext2D, projectile: any) {
  // Основной ледяной шар
  const gradient = ctx.createRadialGradient(
    projectile.position.x, projectile.position.y, 0,
    projectile.position.x, projectile.position.y, PROJECTILE_SIZE * 1.3
  );
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.5, '#a0d8ff');
  gradient.addColorStop(1, '#6eb5ff');
  
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(
    projectile.position.x,
    projectile.position.y,
    PROJECTILE_SIZE * 1.1,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Ледяные кристаллы
  ctx.strokeStyle = '#d0f0ff';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 1;
  
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const innerRadius = PROJECTILE_SIZE * 0.3;
    const outerRadius = PROJECTILE_SIZE * 0.8;
    
    ctx.beginPath();
    ctx.moveTo(
      projectile.position.x + Math.cos(angle) * innerRadius,
      projectile.position.y + Math.sin(angle) * innerRadius
    );
    ctx.lineTo(
      projectile.position.x + Math.cos(angle) * outerRadius,
      projectile.position.y + Math.sin(angle) * outerRadius
    );
    ctx.stroke();
  }

  // Эффект свечения
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#a0d8ff';
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// Рисование лазерного луча
function drawLaserBeam(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  // Основной луч
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Внутренний яркий луч
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Свечение на конце луча
  const gradient = ctx.createRadialGradient(to.x, to.y, 0, to.x, to.y, 15);
  gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(to.x, to.y, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

// Рисование электрической цепи
function drawElectricChain(
  ctx: CanvasRenderingContext2D,
  towerPos: { x: number; y: number },
  enemyPositions: { x: number; y: number }[]
) {
  if (enemyPositions.length === 0) return;

  // Рисуем цепь от башни к первому врагу и между врагами
  const positions = [towerPos, ...enemyPositions];

  for (let i = 0; i < positions.length - 1; i++) {
    const from = positions[i];
    const to = positions[i + 1];

    // Создаем эффект молнии с зигзагами
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);

    // Добавляем случайные зигзаги для эффекта молнии
    const segments = 5;
    for (let j = 1; j <= segments; j++) {
      const t = j / segments;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      
      // Добавляем случайное смещение
      const offset = (Math.random() - 0.5) * 20;
      const perpX = -(to.y - from.y);
      const perpY = (to.x - from.x);
      const len = Math.sqrt(perpX * perpX + perpY * perpY);
      
      if (j === segments) {
        ctx.lineTo(to.x, to.y);
      } else {
        ctx.lineTo(x + (perpX / len) * offset, y + (perpY / len) * offset);
      }
    }

    ctx.stroke();

    // Внутренний яркий луч
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  // Свечение на каждом пораженном враге
  enemyPositions.forEach((pos) => {
    const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 12);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

// Рисование превью башни при размещении
function drawTowerPreview(
  ctx: CanvasRenderingContext2D,
  position: { x: number; y: number },
  towerLevel: 1 | 2 | 3 | 4 | 5,
  existingTowers: Tower[],
  path: { x: number; y: number }[]
) {
  const towerStats = TOWER_STATS[towerLevel][0]; // Base level stats (upgrade level 0)
  const canPlace = canPlaceTower(position, existingTowers, path);
  
  const size = towerStats.size;
  const x = position.x - size / 2;
  const y = position.y - size / 2;

  // Цвета башни в зависимости от уровня
  const colors: Record<number, string> = {
    1: '#4ecdc4',
    2: '#44a5e8',
    3: '#9b59b6',
    4: '#e67e22',
    5: '#3498db',
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
