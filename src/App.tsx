import { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { LevelSelect } from './components/LevelSelect';
import { GameOver } from './components/GameOver';
import { DebugInfo } from './components/DebugInfo';
import type { GameState, Enemy, Tower, Projectile } from './types/game';
import { TOWER_STATS } from './types/game';
import { LEVELS, DEFAULT_PATH } from './config/levels';
import {
  generateId,
  updateEnemyPosition,
  updateProjectilePosition,
  findClosestEnemyInRange,
  checkProjectileHit,
  canPlaceTower,
} from './utils/gameLogic';
import './App.css';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const lastTimeRef = useRef<number>(0);
  const waveSpawnRef = useRef<{
    waveIndex: number;
    enemiesSpawned: number;
    lastSpawnTime: number;
  } | null>(null);

  // Инициализация игры с выбранным уровнем
  const initializeGame = useCallback((levelNumber: number) => {
    const levelConfig = LEVELS[levelNumber - 1];
    if (!levelConfig) return;

    setGameState({
      money: levelConfig.startingMoney,
      lives: levelConfig.startingLives,
      currentWave: 0,
      enemies: [],
      towers: [],
      projectiles: [],
      path: DEFAULT_PATH,
      gameStatus: 'playing',
      selectedTowerLevel: null,
      currentLevel: levelNumber,
    });

    waveSpawnRef.current = null;
    lastTimeRef.current = 0;
  }, []);

  // Начало новой волны
  const startWave = useCallback(() => {
    setGameState((prev) => {
      
      if (!prev) return null;

      const levelConfig = LEVELS[prev.currentLevel - 1];
      const nextWave = prev.currentWave;

      if (nextWave >= levelConfig.waves.length) {
        // Все волны пройдены
        return { ...prev, gameStatus: 'won' };
      }

      // Инициализируем спавн врагов (устанавливаем время в прошлое для мгновенного первого спавна)
      waveSpawnRef.current = {
        waveIndex: nextWave,
        enemiesSpawned: 0,
        lastSpawnTime: Date.now() - 10000, // Первый враг спавнится сразу
      };

      return {
        ...prev,
        currentWave: nextWave + 1,
      };
    });
  }, []);

  // Клик по canvas - размещение башни
  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (!gameState || !gameState.selectedTowerLevel) return;

      const towerStats = TOWER_STATS[gameState.selectedTowerLevel];

      // Проверяем, хватает ли денег
      if (gameState.money < towerStats.cost) return;

      // Проверяем, можно ли поставить башню
      const position = { x, y };
      if (!canPlaceTower(position, gameState.towers, gameState.path)) return;

      const newTower: Tower = {
        id: generateId(),
        position,
        level: gameState.selectedTowerLevel,
        damage: towerStats.damage,
        range: towerStats.range,
        fireRate: towerStats.fireRate,
        lastFireTime: 0,
        cost: towerStats.cost,
      };

      setGameState((prev) =>
        prev
          ? {
              ...prev,
              towers: [...prev.towers, newTower],
              money: prev.money - towerStats.cost,
              selectedTowerLevel: null,
            }
          : null
      );
    },
    [gameState]
  );

  // Основной игровой цикл
  useEffect(() => {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    const gameLoop = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      setGameState((prev) => {
        if (!prev || prev.gameStatus !== 'playing') return prev;

        const levelConfig = LEVELS[prev.currentLevel - 1];
        let enemies = [...prev.enemies];
        let lives = prev.lives;
        let money = prev.money;

        // Спавн врагов
        if (waveSpawnRef.current) {
          const waveConfig = levelConfig.waves[waveSpawnRef.current.waveIndex];
          const timeSinceLastSpawn = Date.now() - waveSpawnRef.current.lastSpawnTime;

          if (
            waveSpawnRef.current.enemiesSpawned < waveConfig.enemyCount &&
            timeSinceLastSpawn >= waveConfig.spawnDelay
          ) {
            const newEnemy: Enemy = {
              id: generateId(),
              position: { ...prev.path[0] },
              health: waveConfig.enemyHealth,
              maxHealth: waveConfig.enemyHealth,
              speed: waveConfig.enemySpeed,
              level: waveConfig.enemyLevel,
              pathIndex: 0,
              reward: waveConfig.enemyReward,
            };

            console.log('🆕 Creating enemy:', newEnemy);
            enemies.push(newEnemy);
            waveSpawnRef.current.enemiesSpawned++;
            waveSpawnRef.current.lastSpawnTime = Date.now();
          }

          // Если все враги заспавнились, останавливаем спавн
          if (waveSpawnRef.current.enemiesSpawned >= waveConfig.enemyCount) {
            waveSpawnRef.current = null;
          }
        }

        // Обновление позиций врагов
        const updatedEnemies: Enemy[] = [];
        let lostLives = 0;
        let earnedMoney = 0;

        for (const enemy of enemies) {
          if (enemy.health <= 0) {
            // Враг мертв
            earnedMoney += enemy.reward;
            continue;
          }

          const updated = updateEnemyPosition(enemy, prev.path, deltaTime);

          if (updated.reachedEnd) {
            lostLives++;
          } else {
            updatedEnemies.push({
              ...enemy,
              position: updated.position,
              pathIndex: updated.pathIndex,
            });
          }
        }

        enemies = updatedEnemies;
        lives -= lostLives;
        money += earnedMoney;

        // Проверка проигрыша
        if (lives <= 0) {
          return { ...prev, gameStatus: 'lost', lives: 0 };
        }

        // Башни стреляют
        const now = Date.now();
        let projectiles: Projectile[] = [...prev.projectiles];

        const updatedTowers = prev.towers.map((tower) => {
          const timeSinceLastFire = now - tower.lastFireTime;
          const fireInterval = 1000 / tower.fireRate;

          if (timeSinceLastFire >= fireInterval) {
            const target = findClosestEnemyInRange(tower, enemies);

            if (target) {
              const projectile: Projectile = {
                id: generateId(),
                position: { ...tower.position },
                targetEnemyId: target.id,
                damage: tower.damage,
                speed: 300,
              };

              projectiles.push(projectile);
              return { ...tower, lastFireTime: now };
            }
          }
          return tower;
        });

        // Обновление снарядов
        const activeProjectiles: Projectile[] = [];

        for (const projectile of projectiles) {
          const target = enemies.find((e) => e.id === projectile.targetEnemyId);

          if (!target) continue;

          const newPosition = updateProjectilePosition(projectile, target.position, deltaTime);

          if (checkProjectileHit({ ...projectile, position: newPosition }, target)) {
            // Попадание
            target.health -= projectile.damage;
          } else {
            // Снаряд продолжает лететь
            activeProjectiles.push({
              ...projectile,
              position: newPosition,
            });
          }
        }

        return {
          ...prev,
          enemies,
          lives,
          money,
          towers: updatedTowers,
          projectiles: activeProjectiles,
        };
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    let animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);

  // Меню выбора уровня
  if (!gameState) {
    return <LevelSelect onSelectLevel={initializeGame} />;
  }

  // Экран игры
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  const canStartWave =
    gameState.currentWave < levelConfig.waves.length &&
    !waveSpawnRef.current &&
    gameState.enemies.length === 0;

  return (
    <div style={styles.app}>
      <div style={styles.gameContainer}>
        <GameCanvas gameState={gameState} onCanvasClick={handleCanvasClick} />
        <GameUI
          money={gameState.money}
          lives={gameState.lives}
          currentWave={gameState.currentWave}
          totalWaves={levelConfig.waves.length}
          currentLevel={gameState.currentLevel}
          gameStatus={gameState.gameStatus}
          selectedTowerLevel={gameState.selectedTowerLevel}
          onSelectTowerLevel={(level) =>
            setGameState((prev) => (prev ? { ...prev, selectedTowerLevel: level } : null))
          }
          onStartWave={startWave}
          onPause={() =>
            setGameState((prev) => (prev ? { ...prev, gameStatus: 'paused' } : null))
          }
          onResume={() =>
            setGameState((prev) => (prev ? { ...prev, gameStatus: 'playing' } : null))
          }
          canStartWave={canStartWave}
        />
      </div>

      {(gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') && (
        <GameOver
          won={gameState.gameStatus === 'won'}
          currentLevel={gameState.currentLevel}
          onRestart={() => initializeGame(gameState.currentLevel)}
          onMenu={() => setGameState(null)}
        />
      )}

      <DebugInfo gameState={gameState} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  gameContainer: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
};

export default App;
