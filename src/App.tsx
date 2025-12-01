import { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { LevelSelect } from './components/LevelSelect';
import { GameOver } from './components/GameOver';
import { DebugInfo } from './components/DebugInfo';
import type { GameState, Enemy, Tower, Projectile } from './types/game';
import { TOWER_STATS } from './types/game';
import { LEVELS, DEFAULT_PATH } from './config/levels';
import { DEV_CONFIG } from './config/dev';
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
  // Атомарные состояния вместо монолитного gameState
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [money, setMoney] = useState(0);
  const [lives, setLives] = useState(0);
  const [currentWave, setCurrentWave] = useState(0);
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'won' | 'lost'>('menu');
  const [selectedTowerLevel, setSelectedTowerLevel] = useState<1 | 2 | 3 | null>(null);
  
  // Игровые сущности
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  
  // Refs для игрового цикла
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

    // Сбрасываем все состояния
    setCurrentLevel(levelNumber);
    setMoney(levelConfig.startingMoney);
    setLives(levelConfig.startingLives);
    setCurrentWave(0);
    setGameStatus('playing');
    setSelectedTowerLevel(null);
    setTowers([]);
    setProjectiles([]);

    let initialEnemies: Enemy[] = [];

    // Создаем тестовых врагов если включен режим отладки
    if (DEV_CONFIG.TEST_ENEMIES) {
      for (let i = 0; i < DEV_CONFIG.TEST_ENEMIES_COUNT; i++) {
        initialEnemies.push({
          id: generateId(),
          position: { x: 30 + i * DEV_CONFIG.TEST_ENEMIES_DISTANCE, y: 130 },
          health: 100,
          maxHealth: 100,
          speed: 50,
          level: i + 1,
          pathIndex: 0,
          reward: 20,
        });
      }
    }

    setEnemies(initialEnemies);
    waveSpawnRef.current = null;
    lastTimeRef.current = 0;

    // Автоматически стартуем первую волну если нет тестовых врагов
    if (!DEV_CONFIG.TEST_ENEMIES) {
      // Небольшая задержка для инициализации
      setTimeout(() => {
        waveSpawnRef.current = {
          waveIndex: 0,
          enemiesSpawned: 0,
          lastSpawnTime: Date.now() - 10000,
        };
        setCurrentWave(1);
      }, 100);
    }
  }, []);

  // Начало новой волны
  const startWave = useCallback(() => {
    if (currentLevel === null) return;

    const levelConfig = LEVELS[currentLevel - 1];
    const nextWaveIndex = currentWave;

    if (nextWaveIndex >= levelConfig.waves.length) {
      // Все волны пройдены
      setGameStatus('won');
      return;
    }

    // Инициализируем спавн врагов
    waveSpawnRef.current = {
      waveIndex: nextWaveIndex,
      enemiesSpawned: 0,
      lastSpawnTime: Date.now() - 10000, // Первый враг спавнится сразу
    };

    setCurrentWave(nextWaveIndex + 1);
  }, [currentLevel, currentWave]);

  // Клик по canvas - размещение башни
  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (!selectedTowerLevel) return;

      const towerStats = TOWER_STATS[selectedTowerLevel];

      // Проверяем, хватает ли денег
      if (money < towerStats.cost) return;

      // Проверяем, можно ли поставить башню
      const position = { x, y };
      if (!canPlaceTower(position, towers, DEFAULT_PATH)) return;

      const newTower: Tower = {
        id: generateId(),
        position,
        level: selectedTowerLevel,
        damage: towerStats.damage,
        range: towerStats.range,
        fireRate: towerStats.fireRate,
        lastFireTime: 0,
        cost: towerStats.cost,
      };

      setTowers((prev) => [...prev, newTower]);
      setMoney((prev) => prev - towerStats.cost);
      setSelectedTowerLevel(null);
    },
    [selectedTowerLevel, money, towers]
  );

  // Основной игровой цикл
  useEffect(() => {
    if (currentLevel === null || gameStatus !== 'playing') return;

    const levelConfig = LEVELS[currentLevel - 1];

    const gameLoop = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // 1. Спавн врагов
      if (waveSpawnRef.current) {
        const waveConfig = levelConfig.waves[waveSpawnRef.current.waveIndex];
        const timeSinceLastSpawn = Date.now() - waveSpawnRef.current.lastSpawnTime;

        if (
          waveSpawnRef.current.enemiesSpawned < waveConfig.enemyCount &&
          timeSinceLastSpawn >= waveConfig.spawnDelay
        ) {
          const newEnemy: Enemy = {
            id: generateId(),
            position: { ...DEFAULT_PATH[0] },
            health: waveConfig.enemyHealth,
            maxHealth: waveConfig.enemyHealth,
            speed: waveConfig.enemySpeed,
            level: waveConfig.enemyLevel,
            pathIndex: 0,
            reward: waveConfig.enemyReward,
          };

          setEnemies((prev) => [...prev, newEnemy]);
          waveSpawnRef.current.enemiesSpawned++;
          waveSpawnRef.current.lastSpawnTime = Date.now();
        }

        // Если все враги заспавнились, останавливаем спавн
        if (waveSpawnRef.current.enemiesSpawned >= waveConfig.enemyCount) {
          waveSpawnRef.current = null;
        }
      }

      // 2. Обновление врагов
      setEnemies((prevEnemies) => {
        const updatedEnemies: Enemy[] = [];
        let lostLives = 0;
        let earnedMoney = 0;

        for (const enemy of prevEnemies) {
          if (enemy.health <= 0) {
            earnedMoney += enemy.reward;
            continue;
          }

          const updated = updateEnemyPosition(enemy, DEFAULT_PATH, deltaTime);

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

        // Обновляем жизни и деньги
        if (lostLives > 0) {
          setLives((prev) => {
            const newLives = prev - lostLives;
            if (newLives <= 0) {
              setGameStatus('lost');
              return 0;
            }
            return newLives;
          });
        }

        if (earnedMoney > 0) {
          setMoney((prev) => prev + earnedMoney);
        }

        return updatedEnemies;
      });

      // 3. Башни стреляют
      const now = Date.now();
      setTowers((prevTowers) => {
        const updatedTowers = [...prevTowers];
        
        prevTowers.forEach((tower, index) => {
          const timeSinceLastFire = now - tower.lastFireTime;
          const fireInterval = 1000 / tower.fireRate;

          if (timeSinceLastFire >= fireInterval) {
            // Получаем текущий список врагов синхронно
            setEnemies((currentEnemies) => {
              const target = findClosestEnemyInRange(tower, currentEnemies);

              if (target) {
                const projectile: Projectile = {
                  id: generateId(),
                  position: { ...tower.position },
                  targetEnemyId: target.id,
                  damage: tower.damage,
                  speed: 300,
                };

                setProjectiles((prev) => [...prev, projectile]);
                updatedTowers[index] = { ...tower, lastFireTime: now };
              }

              return currentEnemies;
            });
          }
        });

        return updatedTowers;
      });

      // 4. Обновление снарядов
      setProjectiles((prevProjectiles) => {
        const activeProjectiles: Projectile[] = [];

        setEnemies((currentEnemies) => {
          const enemiesMap = new Map(currentEnemies.map((e) => [e.id, e]));

          for (const projectile of prevProjectiles) {
            const target = enemiesMap.get(projectile.targetEnemyId);

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

          return Array.from(enemiesMap.values());
        });

        return activeProjectiles;
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    let animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentLevel, gameStatus]);

  // Меню выбора уровня
  if (currentLevel === null) {
    return <LevelSelect onSelectLevel={initializeGame} />;
  }

  // Создаем объект gameState для совместимости с компонентами
  const gameState: GameState = {
    money,
    lives,
    currentWave,
    enemies,
    towers,
    projectiles,
    path: DEFAULT_PATH,
    gameStatus,
    selectedTowerLevel,
    currentLevel,
  };

  // Экран игры
  const levelConfig = LEVELS[currentLevel - 1];
  const canStartWave =
    currentWave < levelConfig.waves.length &&
    !waveSpawnRef.current &&
    enemies.length === 0;

  return (
    <div style={styles.app}>
      <div style={styles.gameContainer}>
        <GameCanvas gameState={gameState} onCanvasClick={handleCanvasClick} />
        <GameUI
          money={money}
          lives={lives}
          currentWave={currentWave}
          totalWaves={levelConfig.waves.length}
          currentLevel={currentLevel}
          gameStatus={gameStatus}
          selectedTowerLevel={selectedTowerLevel}
          onSelectTowerLevel={setSelectedTowerLevel}
          onStartWave={startWave}
          onPause={() => setGameStatus('paused')}
          onResume={() => setGameStatus('playing')}
          canStartWave={canStartWave}
        />
      </div>

      {(gameStatus === 'won' || gameStatus === 'lost') && (
        <GameOver
          won={gameStatus === 'won'}
          currentLevel={currentLevel}
          onRestart={() => initializeGame(currentLevel)}
          onMenu={() => setCurrentLevel(null)}
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
