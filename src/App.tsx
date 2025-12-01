import { useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { LevelSelect } from './components/LevelSelect';
import { GameOver } from './components/GameOver';
import { DebugInfo } from './components/DebugInfo';
import { useGameStore } from './stores/gameStore';
import { useUIStore } from './stores/uiStore';
import type { GameState, Enemy, Tower, Projectile } from './types/game';
import { TOWER_STATS } from './types/game';
import { LEVELS, DEFAULT_PATH } from './config/levels';
import { DEV_CONFIG } from './config/dev';
import {
  canPlaceTower,
  processEnemies,
  processTowerFire,
  processProjectiles,
  processWaveSpawn,
  type WaveSpawnState,
} from './utils/pureGameLogic';
import './App.css';

function App() {
  // Zustand stores
  const {
    enemies,
    towers,
    projectiles,
    money,
    lives,
    currentWave,
    currentLevel,
    gameStatus,
    gameSpeed,
    setEnemies,
    setTowers,
    setProjectiles,
    addEnemy,
    addTower,
    addProjectile,
    setMoney,
    setLives,
    setCurrentWave,
    setCurrentLevel,
    setGameStatus,
    setGameSpeed,
    initializeGame: initializeGameStore,
  } = useGameStore();

  const { selectedTowerLevel, isInitialized, setSelectedTowerLevel, setIsInitialized } = useUIStore();

  // Refs для игрового цикла
  const lastTimeRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);
  const waveSpawnRef = useRef<WaveSpawnState | null>(null);

  // Инициализация игры с выбранным уровнем
  const initializeGame = useCallback(
    (levelNumber: number) => {
      const levelConfig = LEVELS[levelNumber - 1];
      if (!levelConfig) return;

      // Инициализируем store
      initializeGameStore(levelNumber, levelConfig.startingMoney, levelConfig.startingLives);
      setSelectedTowerLevel(null);

      let initialEnemies: Enemy[] = [];

      // Создаем тестовых врагов если включен режим отладки
      if (DEV_CONFIG.TEST_ENEMIES) {
        for (let i = 0; i < DEV_CONFIG.TEST_ENEMIES_COUNT; i++) {
          const enemy: Enemy = {
            id: `test-${i}`,
            position: { x: 30 + i * DEV_CONFIG.TEST_ENEMIES_DISTANCE, y: 130 },
            health: 100,
            maxHealth: 100,
            speed: 50,
            level: i + 1,
            pathIndex: 0,
            reward: 20,
          };
          initialEnemies.push(enemy);
        }
        setEnemies(initialEnemies);
      }

      waveSpawnRef.current = null;
      lastTimeRef.current = 0;
      gameTimeRef.current = 0;
      setIsInitialized(true);

      // Автоматически стартуем первую волну если нет тестовых врагов
      if (!DEV_CONFIG.TEST_ENEMIES) {
        setTimeout(() => {
          waveSpawnRef.current = {
            waveIndex: 0,
            enemiesSpawned: 0,
            lastSpawnTime: -10000,
          };
          setCurrentWave(1);
        }, 100);
      }
    },
    [initializeGameStore, setSelectedTowerLevel, setEnemies, setCurrentWave, setIsInitialized]
  );

  // Начало новой волны
  const startWave = useCallback(() => {
    if (currentLevel === null) return;

    const levelConfig = LEVELS[currentLevel - 1];
    const nextWaveIndex = currentWave;

    if (nextWaveIndex >= levelConfig.waves.length) {
      setGameStatus('won');
      return;
    }

    waveSpawnRef.current = {
      waveIndex: nextWaveIndex,
      enemiesSpawned: 0,
      lastSpawnTime: gameTimeRef.current - 10000,
    };

    setCurrentWave(nextWaveIndex + 1);
  }, [currentLevel, currentWave, setGameStatus, setCurrentWave]);

  // Клик по canvas - размещение башни
  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (!selectedTowerLevel) return;

      const towerStats = TOWER_STATS[selectedTowerLevel];

      if (money < towerStats.cost) return;

      const position = { x, y };
      if (!canPlaceTower(position, towers, DEFAULT_PATH)) return;

      const newTower: Tower = {
        id: `tower-${Date.now()}`,
        position,
        level: selectedTowerLevel,
        damage: towerStats.damage,
        range: towerStats.range,
        fireRate: towerStats.fireRate,
        lastFireTime: 0,
        cost: towerStats.cost,
        size: towerStats.size,
      };

      addTower(newTower);
      setMoney(money - towerStats.cost);
      setSelectedTowerLevel(null);
    },
    [selectedTowerLevel, money, towers, addTower, setMoney, setSelectedTowerLevel]
  );

  // Автоматическая инициализация первого уровня в дев режиме
  useEffect(() => {
    if (DEV_CONFIG.AUTO_START_LEVEL && currentLevel !== null && !isInitialized) {
      initializeGame(currentLevel);
    }
  }, [currentLevel, isInitialized, initializeGame]);

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

      // Получаем актуальные значения из store
      const state = useGameStore.getState();
      const adjustedDeltaTime = deltaTime * state.gameSpeed;
      gameTimeRef.current += adjustedDeltaTime;

      // 1. Спавн врагов
      if (waveSpawnRef.current) {
        const waveConfig = levelConfig.waves[waveSpawnRef.current.waveIndex];
        const spawnResult = processWaveSpawn(
          waveSpawnRef.current,
          waveConfig,
          gameTimeRef.current,
          DEFAULT_PATH[0]
        );

        if (spawnResult.newEnemy) {
          state.addEnemy(spawnResult.newEnemy);
        }

        waveSpawnRef.current = spawnResult.updatedSpawnState;
      }

      // 2. Обновление врагов
      const currentEnemies = useGameStore.getState().enemies;
      const processedEnemies = processEnemies(currentEnemies, DEFAULT_PATH, adjustedDeltaTime);
      state.setEnemies(processedEnemies.activeEnemies);

      if (processedEnemies.lostLives > 0) {
        const currentLives = useGameStore.getState().lives;
        const newLives = currentLives - processedEnemies.lostLives;
        state.setLives(newLives);
        if (newLives <= 0) {
          state.setGameStatus('lost');
        }
      }

      if (processedEnemies.earnedMoney > 0) {
        state.setMoney((prev) => prev + processedEnemies.earnedMoney);
      }

      // 3. Башни стреляют
      const currentGameTime = gameTimeRef.current;
      const currentTowers = useGameStore.getState().towers;
      const newProjectiles: Projectile[] = [];
      const updatedTowers: Tower[] = [];

      for (const tower of currentTowers) {
        const fireResult = processTowerFire(tower, processedEnemies.activeEnemies, currentGameTime);
        updatedTowers.push(fireResult.updatedTower);
        if (fireResult.projectile) {
          newProjectiles.push(fireResult.projectile);
        }
      }

      state.setTowers(updatedTowers);
      newProjectiles.forEach((p) => state.addProjectile(p));

      // 4. Обновление снарядов
      const currentProjectiles = useGameStore.getState().projectiles;
      const processedProjectiles = processProjectiles(
        currentProjectiles,
        processedEnemies.activeEnemies,
        adjustedDeltaTime
      );

      state.setProjectiles(processedProjectiles.activeProjectiles);
      state.setEnemies(processedProjectiles.updatedEnemies);

      // 5. Проверка победы: все волны пройдены и нет врагов
      const currentState = useGameStore.getState();
      const allWavesCompleted = !waveSpawnRef.current && currentState.currentWave >= levelConfig.waves.length;
      const noEnemiesLeft = currentState.enemies.length === 0;
      
      if (allWavesCompleted && noEnemiesLeft && currentState.gameStatus === 'playing') {
        currentState.setGameStatus('won');
        return;
      }

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
    gameSpeed,
  };

  // Экран игры
  const levelConfig = LEVELS[currentLevel - 1];
  const canStartWave =
    currentWave < levelConfig.waves.length &&
    !waveSpawnRef.current &&
    enemies.length === 0;

  return (
    <div className="app-container" style={styles.app}>
      {DEV_CONFIG.SHOW_DEBUG_INFO && (
        <DebugInfo gameState={gameState} onGameSpeedChange={setGameSpeed} />
      )}
      
      <div className="app-main-content" style={styles.mainContent}>
        <div className="app-game-section" style={styles.gameSection}>
          <GameCanvas 
            gameState={gameState} 
            onCanvasClick={handleCanvasClick} 
            selectedTowerLevel={selectedTowerLevel}
            path={DEFAULT_PATH}
          />
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
      </div>

      {(gameStatus === 'won' || gameStatus === 'lost') && (
        <GameOver
          won={gameStatus === 'won'}
          currentLevel={currentLevel}
          onRestart={() => initializeGame(currentLevel)}
          onMenu={() => setCurrentLevel(null)}
        />
      )}
    </div>
  );
}

const app: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#1a1a2e',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  padding: '10px',
  gap: '10px',
};

const mainContent: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  flex: 1,
};

const gameSection: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  alignItems: 'flex-start',
};

const styles = {
  app,
  mainContent,
  gameSection,
};

export default App;
