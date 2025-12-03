import type { 
  Enemy, 
  Tower, 
  Projectile, 
  LaserBeam, 
  ElectricChain, 
  FireProjectile, 
  FlameStream, 
  IceProjectile, 
  IceStream,
  Position,
  GameState,
  LevelConfig
} from '../types/game';
import { processEnemies } from './logic/enemies';
import { processProjectiles, processFireProjectiles, processIceProjectiles, processLaserBeams, processElectricChains, processFlameStreams, processIceStreams } from './logic/projectiles';
import { processTowerFire } from './logic/towers';
import { updateTowerRotations, processWaveSpawn, type WaveSpawnState } from './logic/waves';
import { getEnemy3DManager } from '../components/Enemy3DRenderer';
import { GAME_SETTINGS } from '../config/settings';
import { DEV_CONFIG } from '../config/dev';
import { DEFAULT_PATH } from '../config/gameData/levels';

/**
 * GameEngine - централизованный класс для управления всей игровой логикой
 * 
 * Этот класс отвечает за:
 * - Обработку всех игровых расчетов (враги, башни, снаряды, эффекты)
 * - Независимую симуляцию игры с учетом скорости игры (GAME_SPEED)
 * - Предоставление актуального состояния для рендеринга на канве
 * 
 * Принцип работы:
 * - update() вызывается с произвольной частотой и обрабатывает логику
 * - getState() возвращает текущее состояние для рендеринга на 60 FPS
 * - Все расчеты учитывают gameSpeed для корректной работы на разных скоростях
 */
export class GameEngine {
  // Игровые объекты
  private enemies: Enemy[] = [];
  private towers: Tower[] = [];
  private projectiles: Projectile[] = [];
  private laserBeams: LaserBeam[] = [];
  private electricChains: ElectricChain[] = [];
  private fireProjectiles: FireProjectile[] = [];
  private flameStreams: FlameStream[] = [];
  private iceProjectiles: IceProjectile[] = [];
  private iceStreams: IceStream[] = [];

  // Игровая информация
  private money: number = 0;
  private lives: number = 0;
  private currentWave: number = 0;
  private currentLevel: number | null = null;
  private gameStatus: 'menu' | 'playing' | 'paused' | 'won' | 'lost' = 'menu';
  private gameSpeed: number = 1;

  // Путь для врагов (по умолчанию используем DEFAULT_PATH для отображения)
  private path: Position[] = DEFAULT_PATH;

  // Конфигурация уровня
  private levelConfig: LevelConfig | null = null;

  // Состояние спавна волн
  private waveSpawnState: WaveSpawnState | null = null;

  // Игровое время (с учетом gameSpeed)
  private gameTime: number = 0;

  // Время последнего обновления
  private lastUpdateTime: number = 0;

  // 3D менеджер врагов
  private enemy3DManager = getEnemy3DManager();

  constructor() {
    this.lastUpdateTime = performance.now();
  }

  /**
   * Инициализация игры с уровнем
   */
  initializeLevel(
    levelConfig: LevelConfig,
    path: Position[],
    initialMoney: number,
    initialLives: number
  ): void {
    this.levelConfig = levelConfig;
    this.path = path;
    this.money = initialMoney;
    this.lives = initialLives;
    this.currentLevel = levelConfig.level;
    this.currentWave = 0;
    this.gameStatus = 'playing';
    this.gameSpeed = DEV_CONFIG.GAME_SPEED || 1;
    
    // Очищаем все объекты
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.laserBeams = [];
    this.electricChains = [];
    this.fireProjectiles = [];
    this.flameStreams = [];
    this.iceProjectiles = [];
    this.iceStreams = [];
    
    // Сбрасываем состояние спавна
    this.waveSpawnState = null;
    this.gameTime = 0;
    this.lastUpdateTime = performance.now();
  }

  /**
   * Запустить следующую волну
   */
  startNextWave(): boolean {
    if (!this.levelConfig || !this.canStartWave()) {
      return false;
    }

    this.waveSpawnState = {
      waveIndex: this.currentWave,
      enemiesSpawned: 0,
      lastSpawnTime: this.gameTime,
    };
    this.currentWave++;
    return true;
  }

  /**
   * Можно ли запустить следующую волну
   */
  canStartWave(): boolean {
    if (!this.levelConfig) return false;
    return (
      this.currentWave < this.levelConfig.waves.length &&
      !this.waveSpawnState &&
      this.enemies.length === 0
    );
  }

  /**
   * Основной метод обновления игровой логики
   * Вызывается с произвольной частотой (может быть очень часто на высоких скоростях)
   */
  update(currentTime: number): void {
    if (this.gameStatus !== 'playing' || !this.levelConfig) {
      this.lastUpdateTime = currentTime;
      return;
    }

    // Вычисляем deltaTime в миллисекундах
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // Применяем скорость игры
    const adjustedDeltaTime = deltaTime * this.gameSpeed;
    this.gameTime += adjustedDeltaTime;

    // 1. Спавн врагов
    this.updateWaveSpawn();

    // 2. Обновление врагов
    this.updateEnemies(adjustedDeltaTime);

    // 3. Обновление башен (вращение и строительство)
    this.updateTowers(adjustedDeltaTime);

    // 4. Башни стреляют
    this.processTowersFiring();

    // 5. Обновление снарядов
    this.updateProjectiles(adjustedDeltaTime);

    // 6. Обработка лазерных лучей
    this.updateLaserBeams();

    // 7. Обработка электрических разрядов
    this.updateElectricChains();

    // 8. Обработка огненных снарядов
    this.updateFireProjectiles(adjustedDeltaTime);

    // 9. Обработка потоков огня
    this.updateFlameStreams();

    // 10. Обработка ледяных снарядов
    this.updateIceProjectiles(adjustedDeltaTime);

    // 11. Обработка потоков льда
    this.updateIceStreams();

    // 12. Проверка условий победы/поражения
    this.checkGameConditions();
  }

  /**
   * Спавн врагов из волн
   */
  private updateWaveSpawn(): void {
    if (!this.waveSpawnState || !this.levelConfig) return;

    const waveConfig = this.levelConfig.waves[this.waveSpawnState.waveIndex];
    const spawnResult = processWaveSpawn(
      this.waveSpawnState,
      waveConfig,
      this.gameTime,
      this.path[0]
    );

    if (spawnResult.newEnemy) {
      this.enemies.push(spawnResult.newEnemy);
    }

    this.waveSpawnState = spawnResult.updatedSpawnState;
  }

  /**
   * Обновление врагов
   */
  private updateEnemies(adjustedDeltaTime: number): void {
    const processedEnemies = processEnemies(
      this.enemies,
      this.path,
      adjustedDeltaTime
    );

    // Удаление врагов после завершения анимации смерти
    const enemiesAfterDeath = processedEnemies.activeEnemies.filter(
      (enemy) => {
        if (enemy.isDying && enemy.deathStartTime) {
          const currentTime = Date.now() / 1000;
          const elapsed = currentTime - enemy.deathStartTime;

          if (elapsed >= GAME_SETTINGS.ENEMY_DEATH_ANIMATION_DURATION) {
            this.enemy3DManager.removeEnemy(enemy.id);
            return false;
          }
        }
        return true;
      }
    );

    this.enemies = enemiesAfterDeath;

    // Обработка потерянных жизней
    if (processedEnemies.lostLives > 0) {
      this.lives -= processedEnemies.lostLives;
      if (this.lives <= 0) {
        this.gameStatus = 'lost';
      }
    }

    // Добавление денег за убитых врагов
    if (processedEnemies.earnedMoney > 0) {
      this.money += processedEnemies.earnedMoney;
    }
  }

  /**
   * Обновление башен (вращение и строительство)
   */
  private updateTowers(adjustedDeltaTime: number): void {
    this.towers = updateTowerRotations(
      this.towers,
      adjustedDeltaTime,
      5 // rotation speed
    );
  }

  /**
   * Обработка стрельбы башен
   */
  private processTowersFiring(): void {
    const updatedTowers: Tower[] = [];
    let enemiesAfterFire = this.enemies;

    for (const tower of this.towers) {
      const fireResult = processTowerFire(
        tower,
        enemiesAfterFire,
        this.gameTime
      );
      
      updatedTowers.push(fireResult.updatedTower);
      enemiesAfterFire = fireResult.updatedEnemies;
      
      this.projectiles.push(...fireResult.projectiles);
      this.laserBeams.push(...fireResult.laserBeams);
      this.electricChains.push(...fireResult.electricChains);
      this.fireProjectiles.push(...fireResult.fireProjectiles);
      this.flameStreams.push(...fireResult.flameStreams);
      this.iceProjectiles.push(...fireResult.iceProjectiles);
      this.iceStreams.push(...fireResult.iceStreams);
    }

    this.towers = updatedTowers;
    this.enemies = enemiesAfterFire;
  }

  /**
   * Обновление снарядов
   */
  private updateProjectiles(adjustedDeltaTime: number): void {
    const processedProjectiles = processProjectiles(
      this.projectiles,
      this.enemies,
      adjustedDeltaTime
    );

    this.projectiles = processedProjectiles.activeProjectiles;
    this.enemies = processedProjectiles.updatedEnemies;
  }

  /**
   * Обновление лазерных лучей
   */
  private updateLaserBeams(): void {
    const processedLasers = processLaserBeams(
      this.laserBeams,
      this.enemies,
      this.gameTime
    );

    this.laserBeams = processedLasers.activeLaserBeams;
    this.enemies = processedLasers.updatedEnemies;
  }

  /**
   * Обновление электрических разрядов
   */
  private updateElectricChains(): void {
    const processedElectric = processElectricChains(
      this.electricChains,
      this.enemies,
      this.gameTime
    );

    this.electricChains = processedElectric.activeElectricChains;
    this.enemies = processedElectric.updatedEnemies;
  }

  /**
   * Обновление огненных снарядов
   */
  private updateFireProjectiles(adjustedDeltaTime: number): void {
    const processedFire = processFireProjectiles(
      this.fireProjectiles,
      this.enemies,
      adjustedDeltaTime
    );

    this.fireProjectiles = processedFire.activeFireProjectiles;
    this.enemies = processedFire.updatedEnemies;
  }

  /**
   * Обновление потоков огня
   */
  private updateFlameStreams(): void {
    const processedFlames = processFlameStreams(
      this.flameStreams,
      this.enemies,
      this.gameTime
    );

    this.flameStreams = processedFlames.activeFlameStreams;
    this.enemies = processedFlames.updatedEnemies;
  }

  /**
   * Обновление ледяных снарядов
   */
  private updateIceProjectiles(adjustedDeltaTime: number): void {
    const processedIce = processIceProjectiles(
      this.iceProjectiles,
      this.enemies,
      adjustedDeltaTime
    );

    this.iceProjectiles = processedIce.activeIceProjectiles;
    this.enemies = processedIce.updatedEnemies;
  }

  /**
   * Обновление потоков льда
   */
  private updateIceStreams(): void {
    const processedIceStreams = processIceStreams(
      this.iceStreams,
      this.enemies,
      this.gameTime
    );

    this.iceStreams = processedIceStreams.activeIceStreams;
    this.enemies = processedIceStreams.updatedEnemies;
  }

  /**
   * Проверка условий победы/поражения
   */
  private checkGameConditions(): void {
    if (!this.levelConfig) return;

    // Проверка победы
    const allWavesCompleted =
      !this.waveSpawnState &&
      this.currentWave >= this.levelConfig.waves.length;
    const noEnemiesLeft = this.enemies.length === 0;

    if (allWavesCompleted && noEnemiesLeft && this.gameStatus === 'playing') {
      this.gameStatus = 'won';
    }
  }

  /**
   * Получить текущее состояние игры для рендеринга
   */
  getState(): GameState {
    return {
      enemies: this.enemies,
      towers: this.towers,
      projectiles: this.projectiles,
      laserBeams: this.laserBeams,
      electricChains: this.electricChains,
      fireProjectiles: this.fireProjectiles,
      flameStreams: this.flameStreams,
      iceProjectiles: this.iceProjectiles,
      iceStreams: this.iceStreams,
      money: this.money,
      lives: this.lives,
      currentWave: this.currentWave,
      currentLevel: this.currentLevel,
      gameStatus: this.gameStatus,
      gameSpeed: this.gameSpeed,
      path: this.path,
      selectedTowerLevel: null, // UI state, not game engine state
    };
  }

  // Методы для управления игровым состоянием
  
  addTower(tower: Tower): void {
    this.towers.push(tower);
  }

  removeTower(towerId: string): void {
    this.towers = this.towers.filter(t => t.id !== towerId);
  }

  updateTower(towerId: string, updates: Partial<Tower>): void {
    this.towers = this.towers.map(t => 
      t.id === towerId ? { ...t, ...updates } : t
    );
  }

  setMoney(money: number): void {
    this.money = money;
  }

  addMoney(amount: number): void {
    this.money += amount;
  }

  setGameSpeed(speed: number): void {
    this.gameSpeed = speed;
  }

  getGameSpeed(): number {
    return this.gameSpeed;
  }

  setGameStatus(status: 'menu' | 'playing' | 'paused' | 'won' | 'lost'): void {
    this.gameStatus = status;
  }

  getGameStatus(): string {
    return this.gameStatus;
  }

  getMoney(): number {
    return this.money;
  }

  getLives(): number {
    return this.lives;
  }

  getTowers(): Tower[] {
    return this.towers;
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getCurrentLevel(): number | null {
    return this.currentLevel;
  }

  getPath(): Position[] {
    return this.path;
  }

  reset(): void {
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.laserBeams = [];
    this.electricChains = [];
    this.fireProjectiles = [];
    this.flameStreams = [];
    this.iceProjectiles = [];
    this.iceStreams = [];
    this.money = 0;
    this.lives = 0;
    this.currentWave = 0;
    this.currentLevel = null;
    this.gameStatus = 'menu';
    this.waveSpawnState = null;
    this.gameTime = 0;
  }
}
