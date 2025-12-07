import { useEffect, useCallback, useRef, useState } from "react";
import { Game3DCanvas } from "./components/Game3DCanvas";
import { GameUI } from "./components/GameUI";
import { LevelSelect } from "./components/LevelSelect";
import { GameOver } from "./components/GameOver";
import { DebugInfo } from "./components/DebugInfo";
import { TowerInfo } from "./components/TowerInfo";
import { GameEngine } from "./core/GameEngine";
import { useUIStore } from "./stores/uiStore";
import type { GameState, Enemy } from "./types/game";
import { TOWER_STATS, createTowerFromStats } from "./config/gameData/towers";
import { LEVELS, DEFAULT_PATH } from "./config/gameData/levels";
import { DEV_CONFIG } from "./config/dev";
import { canPlaceTower, calculateTowerSellValue } from "./core/logic/towers";
import "./App.css";

function App() {
  // GameEngine instance
  const gameEngineRef = useRef<GameEngine>(new GameEngine());

  // Состояние для рендеринга (обновляется на каждый кадр)
  const [gameState, setGameState] = useState<GameState>(
    gameEngineRef.current.getState()
  );

  // UI store для управления интерфейсом
  const {
    selectedTowerLevel,
    selectedTowerId,
    setSelectedTowerLevel,
    setSelectedTowerId,
  } = useUIStore();

  // Refs для игрового цикла
  const renderFrameRef = useRef<number>(0);
  const simulationFrameRef = useRef<number>(0);

  // Инициализация игры с выбранным уровнем
  const initializeGame = useCallback(
    (levelNumber: number) => {
      const levelConfig = LEVELS[levelNumber - 1];
      if (!levelConfig) return;

      const engine = gameEngineRef.current;

      // Инициализируем игровой движок
      engine.initializeLevel(
        levelConfig,
        DEFAULT_PATH,
        levelConfig.startingMoney,
        levelConfig.startingLives
      );

      setSelectedTowerLevel(null);

      // Автоматически размещаем башни если включен флаг
      if (DEV_CONFIG.AUTO_PLACE_TOWERS) {
        const tower1 = createTowerFromStats({
          id: "dasdasdas2121",
          position: { x: 275, y: 250 },
          towerLevel: 3,
          upgradeLevel: 0,
        });
        const tower2 = createTowerFromStats({
          id: "dasdasdas2121132",
          position: { x: 631, y: 247 },
          towerLevel: 3,
          upgradeLevel: 5,
        });
        engine.addTower(tower1);
        engine.addTower(tower2);
      }

      // Автоматически стартуем первую волну
      setTimeout(() => {
        engine.startNextWave();
      }, 100);

      // Обновляем UI состояние
      setGameState(engine.getState());
    },
    [setSelectedTowerLevel]
  );

  // Начало новой волны
  const startWave = useCallback(() => {
    const engine = gameEngineRef.current;
    if (engine.startNextWave()) {
      setGameState(engine.getState());
    }
  }, []);

  // Клик по canvas - размещение башни
  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (!selectedTowerLevel) return;

      const engine = gameEngineRef.current;
      const towerStats = TOWER_STATS[selectedTowerLevel][0];

      if (engine.getMoney() < towerStats.cost) return;

      const position = { x, y };
      const currentPath = engine.getPath();
      if (
        !canPlaceTower(
          position,
          engine.getTowers(),
          currentPath.length > 0 ? currentPath : DEFAULT_PATH
        )
      )
        return;

      const newTowerId = `tower-${Date.now()}`;
      const newTower = createTowerFromStats({
        id: newTowerId,
        position,
        towerLevel: selectedTowerLevel,
        upgradeLevel: 0,
      });

      engine.addTower(newTower);
      engine.addMoney(-newTower.cost);
      setSelectedTowerLevel(null);
      setSelectedTowerId(newTowerId);
      setGameState(engine.getState());
    },
    [selectedTowerLevel, setSelectedTowerLevel, setSelectedTowerId]
  );

  // Обработка клика по башне
  const handleTowerClick = useCallback(
    (towerId: string) => {
      setSelectedTowerId(towerId);
      setSelectedTowerLevel(null);
    },
    [setSelectedTowerId, setSelectedTowerLevel]
  );

  // Апгрейд башни
  const handleTowerUpgrade = useCallback(() => {
    if (!selectedTowerId) return;

    const engine = gameEngineRef.current;
    const towers = engine.getTowers();
    const tower = towers.find((t) => t.id === selectedTowerId);
    if (!tower || tower.upgradeLevel + tower.upgradeQueue >= 5) return;

    const nextUpgradeLevel = tower.upgradeLevel + tower.upgradeQueue + 1;
    const nextUpgradeStats = TOWER_STATS[tower.level][nextUpgradeLevel];
    if (!nextUpgradeStats?.upgradeCost) return;
    if (engine.getMoney() < nextUpgradeStats.upgradeCost) return;

    const upgradeTime = nextUpgradeStats.buildTime;

    engine.updateTower(selectedTowerId, {
      upgradeQueue: tower.upgradeQueue + 1,
      buildTimeRemaining: tower.buildTimeRemaining + upgradeTime,
    });
    engine.addMoney(-nextUpgradeStats.upgradeCost);
    setGameState(engine.getState());
  }, [selectedTowerId]);

  // Продажа башни
  const handleTowerSell = useCallback(() => {
    if (!selectedTowerId) return;

    const engine = gameEngineRef.current;
    const towers = engine.getTowers();
    const tower = towers.find((t) => t.id === selectedTowerId);
    if (!tower) return;

    const sellValue = calculateTowerSellValue(tower);
    engine.removeTower(selectedTowerId);
    engine.addMoney(sellValue);
    setSelectedTowerId(null);
    setGameState(engine.getState());
  }, [selectedTowerId, setSelectedTowerId]);

  // Изменение скорости игры
  const handleGameSpeedChange = useCallback((speed: number) => {
    gameEngineRef.current.setGameSpeed(speed);
    setGameState(gameEngineRef.current.getState());
  }, []);

  // Автоматический запуск уровня при монтировании (если включен DEV_CONFIG.AUTO_START_LEVEL)
  useEffect(() => {
    if (
      DEV_CONFIG.AUTO_START_LEVEL &&
      typeof DEV_CONFIG.AUTO_START_LEVEL === "number"
    ) {
      initializeGame(DEV_CONFIG.AUTO_START_LEVEL);
    }
  }, [initializeGame]);

  // Цикл симуляции - работает независимо с учетом gameSpeed
  useEffect(() => {
    const engine = gameEngineRef.current;
    const currentLevel = engine.getCurrentLevel();
    const gameStatus = engine.getGameStatus();

    if (currentLevel === null || gameStatus !== "playing") {
      return;
    }

    const simulationLoop = () => {
      const currentTime = performance.now();

      // Обновляем игровую логику
      // GameEngine сам разбивает большие шаги на маленькие для точности
      engine.update(currentTime);

      // Продолжаем симуляцию
      simulationFrameRef.current = requestAnimationFrame(simulationLoop);
    };

    simulationFrameRef.current = requestAnimationFrame(simulationLoop);

    return () => {
      if (simulationFrameRef.current) {
        cancelAnimationFrame(simulationFrameRef.current);
      }
    };
  }, [gameState.currentLevel, gameState.gameStatus]);

  // Цикл рендеринга - всегда работает на 60 FPS
  useEffect(() => {
    const engine = gameEngineRef.current;

    const renderLoop = () => {
      // Получаем актуальное состояние из движка для рендеринга
      setGameState(engine.getState());

      // Продолжаем рендеринг на 60 FPS
      renderFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (renderFrameRef.current) {
        cancelAnimationFrame(renderFrameRef.current);
      }
    };
  }, []);

  // Меню выбора уровня
  if (gameState.currentLevel === null) {
    return <LevelSelect onSelectLevel={initializeGame} />;
  }

  // Создаем объект gameState с выбранной башней для UI
  const gameStateWithUI: GameState = {
    ...gameState,
    selectedTowerLevel,
  };

  // Экран игры
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  const canStartWave = gameEngineRef.current.canStartWave();

  return (
    <div className="app-container" style={styles.app}>
      {DEV_CONFIG.SHOW_DEBUG_INFO && (
        <DebugInfo
          gameState={gameStateWithUI}
          onGameSpeedChange={handleGameSpeedChange}
        />
      )}

      <div className="app-main-content" style={styles.mainContent}>
        <div className="app-game-section" style={styles.gameSection}>
          <Game3DCanvas
            gameState={gameStateWithUI}
            onCanvasClick={handleCanvasClick}
            onTowerClick={handleTowerClick}
            selectedTowerLevel={selectedTowerLevel}
            selectedTowerId={selectedTowerId}
            path={gameState.path}
          />
          <GameUI
            money={gameState.money}
            lives={gameState.lives}
            currentWave={gameState.currentWave}
            totalWaves={levelConfig.waves.length}
            currentLevel={gameState.currentLevel}
            gameStatus={gameState.gameStatus}
            selectedTowerLevel={selectedTowerLevel}
            onSelectTowerLevel={setSelectedTowerLevel}
            onStartWave={startWave}
            onPause={() => {
              gameEngineRef.current.setGameStatus("paused");
              setGameState(gameEngineRef.current.getState());
            }}
            onResume={() => {
              gameEngineRef.current.setGameStatus("playing");
              setGameState(gameEngineRef.current.getState());
            }}
            canStartWave={canStartWave}
          />
          {selectedTowerId &&
            gameState.towers.find((t) => t.id === selectedTowerId) && (
              <TowerInfo
                tower={gameState.towers.find((t) => t.id === selectedTowerId)!}
                money={gameState.money}
                onUpgrade={handleTowerUpgrade}
                onSell={handleTowerSell}
                onClose={() => setSelectedTowerId(null)}
              />
            )}
        </div>
      </div>

      {(gameState.gameStatus === "won" || gameState.gameStatus === "lost") && (
        <GameOver
          won={gameState.gameStatus === "won"}
          currentLevel={gameState.currentLevel}
          onRestart={() => initializeGame(gameState.currentLevel!)}
          onMenu={() => {
            gameEngineRef.current.reset();
            setGameState(gameEngineRef.current.getState());
          }}
        />
      )}
    </div>
  );
}

const app: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#1a1a2e",
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  padding: "10px",
  gap: "10px",
};

const mainContent: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  flex: 1,
};

const gameSection: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  alignItems: "flex-start",
};

const styles = {
  app,
  mainContent,
  gameSection,
};

export default App;
