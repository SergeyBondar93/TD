import { useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { LevelSelect } from './components/LevelSelect';
import { GameOver } from './components/GameOver';
import { DebugInfo } from './components/DebugInfo';
import { TowerInfo } from './components/TowerInfo';
import { useGameStore } from './stores/gameStore';
import { useUIStore } from './stores/uiStore';
import type { GameState, Enemy, Tower, Projectile, LaserBeam, ElectricChain, FireProjectile, FlameStream, IceProjectile, IceStream } from './types/game';
import { TOWER_STATS, EnemyType, ENEMY_SIZES, WeaponType } from './types/game';
import { LEVELS, DEFAULT_PATH } from './config/levels';
import { DEV_CONFIG } from './config/dev';
import {
  canPlaceTower,
  processEnemies,
  processTowerFire,
  processProjectiles,
  processLaserBeams,
  processElectricChains,
  processFireProjectiles,
  processFlameStreams,
  processIceProjectiles,
  processIceStreams,
  processWaveSpawn,
  updateTowerRotations,
  type WaveSpawnState,
} from './utils/pureGameLogic';
import './App.css';

function App() {
  // Zustand stores
  const {
    enemies,
    towers,
    projectiles,
    laserBeams,
    electricChains,
    fireProjectiles,
    flameStreams,
    iceProjectiles,
    iceStreams,
    money,
    lives,
    currentWave,
    currentLevel,
    gameStatus,
    gameSpeed,
    setEnemies,
    setTowers,
    setProjectiles,
    setLaserBeams,
    setElectricChains,
    setFireProjectiles,
    setFlameStreams,
    setIceProjectiles,
    setIceStreams,
    addEnemy,
    addTower,
    addProjectile,
    addLaserBeam,
    addElectricChain,
    addFireProjectile,
    addFlameStream,
    addIceProjectile,
    addIceStream,
    setMoney,
    setLives,
    setCurrentWave,
    setCurrentLevel,
    setGameStatus,
    setGameSpeed,
    initializeGame: initializeGameStore,
  } = useGameStore();

  const { selectedTowerLevel, selectedTowerId, isInitialized, setSelectedTowerLevel, setSelectedTowerId, setIsInitialized } = useUIStore();

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
          const enemyTypes = [EnemyType.INFANTRY, EnemyType.TANK_SMALL, EnemyType.TANK_MEDIUM, EnemyType.TANK_LARGE];
          const enemyType = enemyTypes[i % enemyTypes.length];
          const enemy: Enemy = {
            id: `test-${i}`,
            position: { x: 30 + i * DEV_CONFIG.TEST_ENEMIES_DISTANCE, y: 130 },
            health: enemyType === EnemyType.INFANTRY ? 100 : 300,
            maxHealth: enemyType === EnemyType.INFANTRY ? 100 : 300,
            speed: 50,
            level: i + 1,
            pathIndex: 0,
            reward: 20,
            type: enemyType,
            size: ENEMY_SIZES[enemyType],
            pathOffset: 0,
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

      const newTowerId = `tower-${Date.now()}`;
      const buildTime = DEV_CONFIG.BASE_BUILD_TIME * 1000 * selectedTowerLevel; // Время строительства зависит от уровня башни
      const newTower: Tower = {
        id: newTowerId,
        position,
        level: selectedTowerLevel,
        damage: towerStats.damage,
        range: towerStats.range,
        fireRate: towerStats.fireRate,
        lastFireTime: 0,
        cost: towerStats.cost,
        size: towerStats.size,
        weaponType: towerStats.weaponType,
        chainCount: towerStats.chainCount,
        areaRadius: (towerStats as any).areaRadius,
        slowEffect: (towerStats as any).slowEffect,
        slowDuration: (towerStats as any).slowDuration,
        rotation: 0,
        targetRotation: 0,
        upgradeLevel: 0,
        baseDamage: towerStats.damage,
        baseRange: towerStats.range,
        baseFireRate: towerStats.fireRate,
        buildTimeRemaining: buildTime,
        upgradeQueue: 0,
      };

      addTower(newTower);
      setMoney(money - towerStats.cost);
      setSelectedTowerLevel(null);
      setSelectedTowerId(newTowerId); // Устанавливаем фокус на новую башню
    },
    [selectedTowerLevel, money, towers, addTower, setMoney, setSelectedTowerLevel, setSelectedTowerId]
  );

  // Обработка клика по башне
  const handleTowerClick = useCallback((towerId: string) => {
    setSelectedTowerId(towerId);
    setSelectedTowerLevel(null); // Отменяем выбор для постройки новой башни
  }, [setSelectedTowerId, setSelectedTowerLevel]);

  // Константы для расчета апгрейдов
  const UPGRADE_COST_MULTIPLIER = 2.5;
  const UPGRADE_DAMAGE_MULTIPLIER = 1.8;
  const UPGRADE_RANGE_MULTIPLIER = 1.15;
  const UPGRADE_FIRE_RATE_MULTIPLIER = 1.2;

  // Апгрейд башни
  const handleTowerUpgrade = useCallback(() => {
    if (!selectedTowerId) return;
    
    const tower = towers.find(t => t.id === selectedTowerId);
    if (!tower || tower.upgradeLevel + tower.upgradeQueue >= 5) return;

    const upgradeCost = Math.round(tower.cost * Math.pow(UPGRADE_COST_MULTIPLIER, tower.upgradeLevel + tower.upgradeQueue + 1));
    if (money < upgradeCost) return;

    const upgradeTime = DEV_CONFIG.BASE_UPGRADE_TIME * 1000 * (tower.upgradeLevel + tower.upgradeQueue + 1);

    const updatedTowers = towers.map(t => {
      if (t.id === selectedTowerId) {
        return {
          ...t,
          upgradeQueue: t.upgradeQueue + 1,
          buildTimeRemaining: t.buildTimeRemaining + upgradeTime,
        };
      }
      return t;
    });

    setTowers(updatedTowers);
    setMoney(money - upgradeCost);
  }, [selectedTowerId, towers, money, setTowers, setMoney]);

  // Продажа башни
  const handleTowerSell = useCallback(() => {
    if (!selectedTowerId) return;
    
    const tower = towers.find(t => t.id === selectedTowerId);
    if (!tower) return;

    // Рассчитываем стоимость завершенных улучшений
    const completedUpgrades = Array.from({ length: tower.upgradeLevel }, (_, i) => 
      Math.round(tower.cost * Math.pow(UPGRADE_COST_MULTIPLIER, i + 1))
    ).reduce((sum, cost) => sum + cost, 0);

    // Рассчитываем стоимость улучшений в очереди
    const queuedUpgrades = Array.from({ length: tower.upgradeQueue || 0 }, (_, i) => 
      Math.round(tower.cost * Math.pow(UPGRADE_COST_MULTIPLIER, tower.upgradeLevel + i + 1))
    ).reduce((sum, cost) => sum + cost, 0);
    
    // Общая инвестиция = базовая стоимость + завершенные + в очереди
    const totalInvested = tower.cost + completedUpgrades + queuedUpgrades;
    const sellValue = Math.round(totalInvested * 0.7);

    // Удаляем башню и возвращаем деньги
    setTowers(towers.filter(t => t.id !== selectedTowerId));
    setMoney(money + sellValue);
    setSelectedTowerId(null);
  }, [selectedTowerId, towers, money, setTowers, setMoney, setSelectedTowerId]);

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
      const newLaserBeams: LaserBeam[] = [];
      const newElectricChains: ElectricChain[] = [];
      const newFireProjectiles: FireProjectile[] = [];
      const newFlameStreams: FlameStream[] = [];
      const newIceProjectiles: IceProjectile[] = [];
      const newIceStreams: IceStream[] = [];
      const updatedTowers: Tower[] = [];

      for (const tower of currentTowers) {
        const fireResult = processTowerFire(tower, processedEnemies.activeEnemies, currentGameTime);
        updatedTowers.push(fireResult.updatedTower);
        if (fireResult.projectile) {
          newProjectiles.push(fireResult.projectile);
        }
        if (fireResult.laserBeam) {
          newLaserBeams.push(fireResult.laserBeam);
        }
        if (fireResult.electricChain) {
          newElectricChains.push(fireResult.electricChain);
        }
        if (fireResult.fireProjectile) {
          newFireProjectiles.push(fireResult.fireProjectile);
        }
        if (fireResult.flameStream) {
          newFlameStreams.push(fireResult.flameStream);
        }
        if (fireResult.iceProjectile) {
          newIceProjectiles.push(fireResult.iceProjectile);
        }
        if (fireResult.iceStream) {
          newIceStreams.push(fireResult.iceStream);
        }
      }

      state.setTowers(updatedTowers);
      newProjectiles.forEach((p) => state.addProjectile(p));
      newLaserBeams.forEach((l) => state.addLaserBeam(l));
      newElectricChains.forEach((e) => state.addElectricChain(e));
      newFireProjectiles.forEach((f) => state.addFireProjectile(f));
      newFlameStreams.forEach((f) => state.addFlameStream(f));
      newIceProjectiles.forEach((i) => state.addIceProjectile(i));
      newIceStreams.forEach((i) => state.addIceStream(i));

      // 3.5. Обновление вращения башен (плавная интерполяция) и времени строительства/улучшения
      const rotatedTowers = updateTowerRotations(
        useGameStore.getState().towers,
        adjustedDeltaTime,
        5, // rotation speed
        {
          damageMultiplier: UPGRADE_DAMAGE_MULTIPLIER,
          rangeMultiplier: UPGRADE_RANGE_MULTIPLIER,
          fireRateMultiplier: UPGRADE_FIRE_RATE_MULTIPLIER,
        }
      );
      state.setTowers(rotatedTowers);

      // 4. Обновление снарядов
      const currentProjectiles = useGameStore.getState().projectiles;
      const processedProjectiles = processProjectiles(
        currentProjectiles,
        processedEnemies.activeEnemies,
        adjustedDeltaTime
      );

      state.setProjectiles(processedProjectiles.activeProjectiles);
      state.setEnemies(processedProjectiles.updatedEnemies);

      // 5. Обработка лазерных лучей
      const currentLaserBeams = useGameStore.getState().laserBeams;
      const processedLasers = processLaserBeams(
        currentLaserBeams,
        useGameStore.getState().enemies,
        currentGameTime
      );

      state.setLaserBeams(processedLasers.activeLaserBeams);
      state.setEnemies(processedLasers.updatedEnemies);

      // 6. Обработка электрических разрядов
      const currentElectricChains = useGameStore.getState().electricChains;
      const processedElectric = processElectricChains(
        currentElectricChains,
        useGameStore.getState().enemies,
        currentGameTime
      );

      state.setElectricChains(processedElectric.activeElectricChains);
      state.setEnemies(processedElectric.updatedEnemies);

      // 7. Обработка огненных снарядов
      const currentFireProjectiles = useGameStore.getState().fireProjectiles;
      const processedFire = processFireProjectiles(
        currentFireProjectiles,
        useGameStore.getState().enemies,
        adjustedDeltaTime
      );

      state.setFireProjectiles(processedFire.activeFireProjectiles);
      state.setEnemies(processedFire.updatedEnemies);

      // 7.5. Обработка потоков огня (огнемет)
      const currentFlameStreams = useGameStore.getState().flameStreams;
      const processedFlames = processFlameStreams(
        currentFlameStreams,
        useGameStore.getState().enemies,
        adjustedDeltaTime,
        currentGameTime
      );

      state.setFlameStreams(processedFlames.activeFlameStreams);
      state.setEnemies(processedFlames.updatedEnemies);

      // 8. Обработка ледяных снарядов
      const currentIceProjectiles = useGameStore.getState().iceProjectiles;
      const processedIce = processIceProjectiles(
        currentIceProjectiles,
        useGameStore.getState().enemies,
        adjustedDeltaTime
      );

      state.setIceProjectiles(processedIce.activeIceProjectiles);
      state.setEnemies(processedIce.updatedEnemies);

      // 8.5. Обработка потоков льда
      const currentIceStreams = useGameStore.getState().iceStreams;
      const processedIceStreams = processIceStreams(
        currentIceStreams,
        useGameStore.getState().enemies,
        adjustedDeltaTime,
        currentGameTime
      );

      state.setIceStreams(processedIceStreams.activeIceStreams);
      state.setEnemies(processedIceStreams.updatedEnemies);

      // 9. Проверка победы: все волны пройдены и нет врагов
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
    laserBeams,
    electricChains,
    fireProjectiles,
    flameStreams,
    iceProjectiles,
    iceStreams,
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
            onTowerClick={handleTowerClick}
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
          {selectedTowerId && (
            <TowerInfo
              tower={towers.find(t => t.id === selectedTowerId)!}
              money={money}
              onUpgrade={handleTowerUpgrade}
              onSell={handleTowerSell}
              onClose={() => setSelectedTowerId(null)}
            />
          )}
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
