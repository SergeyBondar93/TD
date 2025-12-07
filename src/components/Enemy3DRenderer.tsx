import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { loadSoldierModel } from "../utils/modelLoader";
import type { LoadedModel } from "../utils/modelLoader";
import type { EnemyModelConfig } from "../config/gameData/enemies";

// Функция для правильного клонирования модели со скелетной анимацией
function cloneModelWithSkeleton(source: THREE.Object3D): THREE.Object3D {
  // Используем SkeletonUtils.clone для правильного клонирования моделей с SkinnedMesh/Skeleton
  return SkeletonUtils.clone(source) as THREE.Object3D;
}

// Состояние врага для рендеринга
interface EnemyRenderState {
  model: THREE.Group;
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
  private createEnemyModel(): THREE.Group {
    if (!this.baseModel) {
      throw new Error("Base model not loaded");
    }

    // Клонируем базовую модель со скелетом
    const model = cloneModelWithSkeleton(this.baseModel.scene) as THREE.Group;

    // Отладочный лог только для первого создания модели
    if (!this.enemies.size) {
      console.log('[Enemy3DRenderer] ✅ Создана модель врага');
    }

    return model;
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
      enemy.config = config;
      return enemy.model;
    }

    // Создаем новую модель для врага
    try {
      const enemyModel = this.createEnemyModel();

      // Сохраняем состояние врага
      this.enemies.set(enemyId, {
        model: enemyModel,
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

  // Удаляем врага полностью
  public removeEnemy(enemyId: string) {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      this.enemies.delete(enemyId);
    }
  }

  public isLoaded(): boolean {
    return this.isModelLoaded;
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
