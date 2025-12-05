import * as THREE from "three";
import { loadSpiderModel } from "../utils/modelLoader";
import type { LoadedModel } from "../utils/modelLoader";
import type { EnemyModelConfig } from "../config/gameData/enemies";
import { DEV_CONFIG } from "../config/dev";

// Состояние врага для рендеринга
interface EnemyRenderState {
  model: THREE.Group;
  animationTime: number;
  isDying: boolean;
  deathStartTime: number;
  deathDuration: number;
  fadeOutDuration: number;
  knockbackOffset?: { x: number; y: number; z: number }; // Вектор отлета при смерти
  config: EnemyModelConfig;
  boxHelper?: THREE.BoxHelper; // Отладочный бокс
}

// Класс для управления 3D рендерингом врагов
class Enemy3DManager {
  private baseModel: LoadedModel | null = null;
  private isModelLoaded = false;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private enemies: Map<string, EnemyRenderState> = new Map(); // Хранилище врагов по ID

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = null;
    const viewSize = 3;
    this.camera = new THREE.OrthographicCamera(
      -viewSize, viewSize,
      viewSize, -viewSize,
      0.1, 100
    );
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(512, 512);
    this.renderer.setClearColor(0x000000, 0);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
    backLight.position.set(-5, 5, -5);
    this.scene.add(backLight);
    this.loadModel();
  }

  private async loadModel() {
    try {
      console.log("[Enemy3DManager] Starting to load base model...");

      // Загружаем базовую модель паука
      this.baseModel = await loadSpiderModel();
      this.isModelLoaded = true;

      console.log("[Enemy3DManager] Base model loaded successfully!");
    } catch (error) {
      console.error("[Enemy3DManager] Failed to load base model:", error);
    }
  }

  // Создаем новую модель для врага
  private createEnemyModel(config: EnemyModelConfig): THREE.Group {
    if (!this.baseModel) {
      throw new Error("Base model not loaded");
    }

    // Клонируем базовую модель
    const modelClone = this.baseModel.scene.clone(true);

    // Вычисляем bounding box для центрирования
    const box = new THREE.Box3().setFromObject(modelClone);
    const center = box.getCenter(new THREE.Vector3());

    // Создаем группу-контейнер для врага
    const enemyGroup = new THREE.Group();

    // Центрируем модель
    modelClone.position.set(-center.x, -box.min.y, -center.z);

    // Применяем масштаб из конфигурации (преобразуем проценты в десятичные)
    const scaleFactor = config.scale / 100;
    enemyGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Добавляем модель в группу
    enemyGroup.add(modelClone);

    return enemyGroup;
  }

  // Получаем или создаем модель для врага
  public getOrCreateEnemy(
    enemyId: string,
    config: EnemyModelConfig
  ): THREE.Group | null {
    if (!this.isModelLoaded) {
      return null;
    }

    // Если враг уже существует, обновляем его конфиг и возвращаем модель
    if (this.enemies.has(enemyId)) {
      const enemy = this.enemies.get(enemyId)!;
      // Обновляем конфиг на актуальный
      enemy.config = config;
      enemy.deathDuration = config.animations.death.duration;
      enemy.fadeOutDuration = config.animations.death.fadeOutDuration;
      return enemy.model;
    }

    // Создаем новую модель для врага
    try {
      const enemyModel = this.createEnemyModel(config);
      // НЕ добавляем в свою сцену, модель будет добавлена в основную сцену Game3DCanvas
      // this.scene.add(enemyModel);

      // Создаём зелёный отладочный бокс (только если включен флаг)
      let boxHelper: THREE.BoxHelper | undefined;
      if (DEV_CONFIG.SHOW_ENEMY_3D_BOXES) {
        boxHelper = new THREE.BoxHelper(enemyModel, 0x00ff00);
        // this.scene.add(boxHelper); // Тоже не добавляем в свою сцену
      }

      // Сохраняем состояние врага
      this.enemies.set(enemyId, {
        model: enemyModel,
        animationTime: 0,
        isDying: false,
        deathStartTime: 0,
        deathDuration: config.animations.death.duration,
        fadeOutDuration: config.animations.death.fadeOutDuration,
        config,
        boxHelper,
      });

      return enemyModel;
    } catch (error) {
      console.error("[Enemy3DManager] Failed to create enemy model:", error);
      return null;
    }
  }

  // Начинаем анимацию смерти
  public startDeathAnimation(enemyId: string, deathStartTime?: number) {
    const enemy = this.enemies.get(enemyId);
    if (!enemy) {
      return;
    }

    // Если анимация уже запущена, не запускаем повторно
    if (enemy.isDying) {
      return;
    }

    enemy.isDying = true;
    // Используем переданное время или текущее
    enemy.deathStartTime = deathStartTime ?? Date.now() / 1000;

    // Генерируем случайный вектор отлета
    const knockbackDistance =
      enemy.config.animations.death.knockbackDistance || 0;
    if (knockbackDistance > 0) {
      const angle = Math.random() * Math.PI * 2; // Случайный угол
      const distance = knockbackDistance * (0.5 + Math.random() * 0.5); // От 50% до 100% расстояния
      const flipOver = enemy.config.animations.death.flipOver;
      const zOffset = flipOver && typeof flipOver === 'object' ? flipOver.z : 5;
      enemy.knockbackOffset = {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        z: zOffset,
      };
    }
  }

  // Проверяем, завершена ли анимация смерти
  public isDeathAnimationComplete(enemyId: string): boolean {
    const enemy = this.enemies.get(enemyId);
    if (!enemy) {
      return false;
    }

    if (!enemy.isDying) {
      return false;
    }

    const currentTime = Date.now() / 1000;
    const totalDuration = enemy.deathDuration + enemy.fadeOutDuration;
    const elapsed = currentTime - enemy.deathStartTime;
    const isComplete = elapsed >= totalDuration;

    return isComplete;
  }

  // Проверяем, находится ли враг в состоянии анимации смерти
  public isEnemyDying(enemyId: string): boolean {
    const enemy = this.enemies.get(enemyId);
    return enemy?.isDying ?? false;
  }


  // Удаляем врага полностью
  public removeEnemy(enemyId: string) {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      // НЕ удаляем из сцены, так как модель в основной сцене Game3DCanvas
      // this.scene.remove(enemy.model);
      if (enemy.boxHelper) {
        // this.scene.remove(enemy.boxHelper);
      }
      this.enemies.delete(enemyId);
    }
  }

  // Обновляем анимацию без рендеринга
  public updateAnimation(
    enemyId: string,
    deltaTime: number,
    gameSpeed: number = 1
  ) {
    const enemy = this.enemies.get(enemyId);
    if (!enemy || !this.baseModel) {
      return;
    }

    const { model, config, isDying } = enemy;
    const spiderModel = model.children[0];

    if (!spiderModel || isDying) {
      return;
    }

    // Анимация ходьбы
    const walkConfig = config.animations.walk;
    if (walkConfig && !isDying) {
      // Умножаем на gameSpeed чтобы анимация коррелировала со скоростью игры
      enemy.animationTime += deltaTime * (walkConfig.speed || 8) * gameSpeed;

      // Покачивание вверх-вниз
      const bobAmount =
        walkConfig.bobAmount !== undefined ? walkConfig.bobAmount : 0.05;
      spiderModel.position.y = Math.sin(enemy.animationTime) * bobAmount;

      // Покачивание из стороны в сторону
      const swayAmount =
        walkConfig.swayAmount !== undefined ? walkConfig.swayAmount : 0.12;
      spiderModel.position.x = Math.sin(enemy.animationTime * 0.5) * swayAmount;

      // Наклон при движении
      const tiltAmount =
        walkConfig.tiltAmount !== undefined ? walkConfig.tiltAmount : 0.15;
      spiderModel.rotation.z = Math.sin(enemy.animationTime * 0.7) * tiltAmount;
    }

    // Обновляем миксер анимаций (если есть)
    if (this.baseModel.mixer) {
      this.baseModel.mixer.update(deltaTime);
    }
  }

  // Обновляем анимацию смерти
  public updateDeathAnimation(
    enemyId: string,
    deltaTime: number,
    gameSpeed: number = 1
  ) {
    const enemy = this.enemies.get(enemyId);
    if (!enemy || !enemy.isDying) {
      return;
    }

    const {
      model,
      config,
      deathStartTime,
      deathDuration,
      fadeOutDuration,
      knockbackOffset,
    } = enemy;

    const currentTime = Date.now() / 1000;
    const elapsed = currentTime - deathStartTime;
    const totalDuration = deathDuration + fadeOutDuration;

    // Анимация смерти
    if (elapsed < deathDuration) {
      const deathProgress = elapsed / deathDuration;

      // Падение и вращение
      const spiderModel = model.children[0];
      if (spiderModel) {
        const deathConfig = config.animations.death;
        const fallSpeed = deathConfig.fallSpeed || 1;
        const spinSpeed = deathConfig.spinSpeed || 2;

        spiderModel.position.y = -deathProgress * fallSpeed;
        spiderModel.rotation.x = deathProgress * Math.PI * spinSpeed;

        // Применяем отлет при смерти к внутренней модели
        if (knockbackOffset) {
          const knockbackProgress = Math.min(1, deathProgress * 2);
          const easeOut = 1 - Math.pow(1 - knockbackProgress, 3);
          spiderModel.position.x = knockbackOffset.x * easeOut;
          spiderModel.position.z = knockbackOffset.y * easeOut + knockbackOffset.z * easeOut;
        }
      }
    }
    // Фаза исчезновения
    else if (elapsed < totalDuration) {
      const fadeProgress = (elapsed - deathDuration) / fadeOutDuration;
      
      // Уменьшаем прозрачность
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          material.transparent = true;
          material.opacity = 1 - fadeProgress;
        }
      });
    }
  }

  public isLoaded(): boolean {
    return this.isModelLoaded;
  }

  public dispose() {
    // Удаляем всех врагов
    this.enemies.forEach((_, id) => {
      this.removeEnemy(id);
    });
    this.renderer.dispose();
  }
}

// Singleton instance
let enemy3DManager: Enemy3DManager | null = null;

export function getEnemy3DManager(): Enemy3DManager {
  if (!enemy3DManager) {
    enemy3DManager = new Enemy3DManager();
  }
  return enemy3DManager;
}

