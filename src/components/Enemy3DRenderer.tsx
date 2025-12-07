import * as THREE from "three";
import { loadSoldierModel } from "../utils/modelLoader";
import type { LoadedModel } from "../utils/modelLoader";
import type { EnemyModelConfig } from "../config/gameData/enemies";

// Состояние врага для рендеринга
interface EnemyRenderState {
  model: THREE.Group;
  modelClone: THREE.Group; // Внутренняя модель (для анимации)
  modelHeight: number; // Высота модели (для компенсации при переворачивании)
  animationTime: number;
  isDying: boolean;
  deathStartTime: number;
  deathDuration: number;
  fadeOutDuration: number;
  knockbackOffset?: { x: number; y: number; z: number }; // Вектор отлета при смерти
  randomFlipRotation?: { x: number; y: number; z: number }; // Случайные углы вращения при смерти
  config: EnemyModelConfig;
}

// Класс для управления 3D рендерингом врагов
class Enemy3DManager {
  private baseModel: LoadedModel | null = null;
  private isModelLoaded = false;
  private enemies: Map<string, EnemyRenderState> = new Map(); // Хранилище врагов по ID

  constructor() {
    this.loadModel();
  }

  private async loadModel() {
    try {
      console.log('[Enemy3DRenderer] Загрузка базовой модели...');
      this.baseModel = await loadSoldierModel();
      this.isModelLoaded = true;
      console.log('[Enemy3DRenderer] ✅ Базовая модель загружена, готова к использованию');
    } catch (error) {
      console.error('[Enemy3DRenderer] ❌ Ошибка загрузки базовой модели:', error);
    }
  }

  // Создаем новую модель для врага
  private createEnemyModel(config: EnemyModelConfig): {
    group: THREE.Group;
    modelClone: THREE.Group;
    height: number;
    configScale: number;
  } {
    if (!this.baseModel) {
      throw new Error("Base model not loaded");
    }

    // Клонируем базовую модель
    const modelClone = this.baseModel.scene.clone(true);
    console.log('[Enemy3DRenderer] Клонированная модель:', modelClone);
    // Вычисляем bounding box для центрирования
    const box = new THREE.Box3().setFromObject(modelClone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const height = size.y; // Сохраняем высоту модели БЕЗ scale

    // Создаем группу-контейнер для врага
    const enemyGroup = new THREE.Group();

    // Центрируем модель так, чтобы нижняя часть была на y=0
    modelClone.position.set(-center.x, -box.min.y, -center.z);

    // НЕ применяем scale здесь - он будет применен в Game3DCanvas вместе с sizeScale
    // Просто сохраняем значение scale из конфигурации
    const configScale = config.scale / 20;
    // Добавляем модель в группу
    enemyGroup.add(modelClone);

    // Отладочный лог только для первого создания модели
    if (!this.enemies.size) {
      console.log('[Enemy3DRenderer] Создана модель врага:', {
        originalSize: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
        originalCenter: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) },
        modelClonePosition: { x: modelClone.position.x.toFixed(2), y: modelClone.position.y.toFixed(2), z: modelClone.position.z.toFixed(2) },
        configScale: configScale.toFixed(3),
        meshCount: modelClone.children.length
      });
    }

    return { group: enemyGroup, modelClone, height, configScale };
  }

  // Получаем или создаем модель для врага
  public getOrCreateEnemy(
    enemyId: string,
    config: EnemyModelConfig
  ): THREE.Group | null {
    if (!this.isModelLoaded) {
      // Логируем только первые несколько раз, чтобы не спамить
      if (this.enemies.size === 0) {
        console.warn('[Enemy3DRenderer] ⚠️ Модель еще не загружена, враг не может быть создан');
      }
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
      const {
        group: enemyModel,
        modelClone,
        height,
        configScale,
      } = this.createEnemyModel(config);
      // НЕ добавляем в свою сцену, модель будет добавлена в основную сцену Game3DCanvas
      // this.scene.add(enemyModel);

      // Сохраняем состояние врага
      this.enemies.set(enemyId, {
        model: enemyModel,
        modelClone: modelClone,
        modelHeight: height * configScale, // Высота с учетом scale из конфигурации
        animationTime: 0,
        isDying: false,
        deathStartTime: 0,
        deathDuration: config.animations.death.duration,
        fadeOutDuration: config.animations.death.fadeOutDuration,
        config,
      });

      // Логируем только первые несколько созданий
      if (this.enemies.size <= 3) {
        console.log(`[Enemy3DRenderer] ✅ Создан враг ${enemyId}, всего врагов: ${this.enemies.size}`);
      }

      return enemyModel;
    } catch (error) {
      console.error(`[Enemy3DRenderer] ❌ Ошибка создания модели для врага ${enemyId}:`, error);
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

    // Генерируем случайный вектор отлета в горизонтальной плоскости
    const knockbackDistance =
      enemy.config.animations.death.knockbackDistance || 0;

    // Всегда генерируем отскок, даже если knockbackDistance не задан
    let baseDistance = knockbackDistance;
    if (baseDistance <= 0) {
      // Если не задан, используем минимальный отскок
      baseDistance = 10;
    }

    // Генерируем случайный угол и расстояние
    const angle = Math.random() * Math.PI * 2; // Случайный угол в горизонтальной плоскости
    // Расстояние от 60% до 120% базового значения для более заметного эффекта
    const distance = baseDistance * (0.6 + Math.random() * 0.6);

    // Генерируем отскок только в горизонтальной плоскости (x и z)
    // y не используется, так как паук должен оставаться на земле
    enemy.knockbackOffset = {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance, // Это будет использовано как z-координата
      z: 0, // Не поднимаем паука вверх
    };

    // Генерируем случайные углы вращения при смерти
    const flipOver = enemy.config.animations.death.flipOver;
    if (flipOver) {
      // Используем значения из конфигурации как множители для случайного вращения
      // Генерируем случайные углы от 0 до значения из конфигурации * Math.PI
      const randomX = (Math.random() - 0.5) * 2 * (flipOver.x || 0) * Math.PI; // От -x*PI до +x*PI
      const randomY = (Math.random() - 0.5) * 2 * (flipOver.y || 0) * Math.PI; // От -y*PI до +y*PI
      const randomZ = (Math.random() - 0.5) * 2 * (flipOver.z || 0) * Math.PI; // От -z*PI до +z*PI

      enemy.randomFlipRotation = {
        x: randomX,
        y: randomY,
        z: randomZ,
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

    const { modelClone, config, isDying } = enemy;

    if (!modelClone || isDying) {
      return;
    }

    // Анимация ходьбы
    const walkConfig = config.animations.walk;
    if (walkConfig && !isDying) {
      // Умножаем на gameSpeed чтобы анимация коррелировала со скоростью игры
      enemy.animationTime += deltaTime * (walkConfig.speed || 8) * gameSpeed;

      // Покачивание вверх-вниз (относительно начальной позиции)
      const bobAmount =
        walkConfig.bobAmount !== undefined ? walkConfig.bobAmount : 0.05;
      const baseY = -enemy.modelHeight / 2; // Базовая позиция Y (нижняя часть на y=0)
      modelClone.position.y = baseY + Math.sin(enemy.animationTime) * bobAmount;

      // Покачивание из стороны в сторону
      const swayAmount =
        walkConfig.swayAmount !== undefined ? walkConfig.swayAmount : 0.12;
      modelClone.position.x = Math.sin(enemy.animationTime * 0.5) * swayAmount;

      // Наклон при движении
      const tiltAmount =
        walkConfig.tiltAmount !== undefined ? walkConfig.tiltAmount : 0.15;
      modelClone.rotation.z = Math.sin(enemy.animationTime * 0.7) * tiltAmount;
    }

    // Обновляем миксер анимаций (если есть)
    if (this.baseModel.mixer) {
      this.baseModel.mixer.update(deltaTime);
    }
  }

  // Обновляем анимацию смерти
  public updateDeathAnimation(
    enemyId: string,
    _deltaTime: number,
    _gameSpeed: number = 1
  ) {
    const enemy = this.enemies.get(enemyId);
    if (!enemy || !enemy.isDying) {
      return;
    }

    const {
      model,
      modelClone,
      modelHeight,
      config,
      deathStartTime,
      deathDuration,
      fadeOutDuration,
      randomFlipRotation,
    } = enemy;

    const currentTime = Date.now() / 1000;
    const elapsed = currentTime - deathStartTime;
    const totalDuration = deathDuration + fadeOutDuration;

    // Анимация смерти
    if (elapsed < deathDuration) {
      const deathProgress = elapsed / deathDuration;
      const deathConfig = config.animations.death;
      const flipOver = deathConfig.flipOver;

      // Определяем функцию плавности из конфигурации
      let easeOut: number;
      if (flipOver?.easeFunction === "easeOut") {
        easeOut = 1 - Math.pow(1 - deathProgress, 3);
      } else {
        // По умолчанию easeOut
        easeOut = 1 - Math.pow(1 - deathProgress, 3);
      }

      // Применяем переворачивание согласно конфигурации flipOver
      if (flipOver && randomFlipRotation) {
        // Используем заранее сгенерированные случайные углы вращения
        const flipX = easeOut * randomFlipRotation.x;
        const flipY = easeOut * randomFlipRotation.y;
        const flipZ = easeOut * randomFlipRotation.z;

        modelClone.rotation.x = flipX;
        modelClone.rotation.y = flipY;
        modelClone.rotation.z = flipZ;

        // Компенсируем смещение по Y при переворачивании
        // Когда модель переворачивается, её центр может смещаться
        // Поднимаем модель вверх, чтобы она оставалась на земле
        if (Math.abs(flipX) > 0.1) {
          const yOffset = (modelHeight / 2) * (1 - Math.cos(flipX));
          const newY = -modelHeight / 2 + yOffset;
          modelClone.position.y = newY;
        }
      } else if (flipOver) {
        // Fallback: если случайные углы не были сгенерированы, используем конфигурацию
        const flipX = flipOver.x ? easeOut * flipOver.x * Math.PI : 0;
        const flipY = flipOver.y ? easeOut * flipOver.y * Math.PI : 0;
        const flipZ = flipOver.z ? easeOut * flipOver.z * Math.PI : 0;

        modelClone.rotation.x = flipX;
        modelClone.rotation.y = flipY;
        modelClone.rotation.z = flipZ;

        if (Math.abs(flipX) > 0.1) {
          const yOffset = (modelHeight / 2) * (1 - Math.cos(flipX));
          modelClone.position.y = -modelHeight / 2 + yOffset;
        }
      } else {
        // Если flipOver не задан, используем стандартное переворачивание по оси X
        modelClone.rotation.x = easeOut * Math.PI;
        const yOffset = (modelHeight / 2) * (1 - Math.cos(easeOut * Math.PI));
        modelClone.position.y = -modelHeight / 2 + yOffset;
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

  // Получаем текущий offset отскока для врага (для применения к позиции в сцене)
  public getKnockbackOffset(
    enemyId: string,
    elapsed: number,
    deathDuration: number
  ): { x: number; z: number } | null {
    const enemy = this.enemies.get(enemyId);
    if (!enemy || !enemy.isDying || !enemy.knockbackOffset) {
      return null;
    }

    const deathProgress = elapsed / deathDuration;
    const knockbackProgress = Math.min(1, deathProgress * 1.5);
    const knockbackEase = 1 - Math.pow(1 - knockbackProgress, 2);

    return {
      x: enemy.knockbackOffset.x * knockbackEase,
      z: enemy.knockbackOffset.y * knockbackEase, // y в knockbackOffset используется как z
    };
  }

  public isLoaded(): boolean {
    return this.isModelLoaded;
  }

  public dispose() {
    // Удаляем всех врагов
    this.enemies.forEach((_, id) => {
      this.removeEnemy(id);
    });
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
