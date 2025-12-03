import * as THREE from 'three';
import { loadSpiderModel } from '../utils/modelLoader';
import type { LoadedModel } from '../utils/modelLoader';
import type { EnemyModelConfig } from '../config/enemies';

// Состояние врага для рендеринга
interface EnemyRenderState {
  model: THREE.Group;
  animationTime: number;
  isDying: boolean;
  deathStartTime: number;
  deathDuration: number;
  fadeOutDuration: number;
  knockbackOffset?: { x: number; y: number }; // Вектор отлета при смерти
  config: EnemyModelConfig;
}

// Класс для управления 3D рендерингом врагов
class Enemy3DManager {
  private baseModel: LoadedModel | null = null;
  private isModelLoaded = false;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private enemies: Map<string, EnemyRenderState> = new Map(); // Хранилище врагов по ID

  constructor() {
    console.log('[Enemy3DManager] Constructor called');
    
    // Создаём Three.js сцену
    this.scene = new THREE.Scene();
    this.scene.background = null; // Прозрачный фон
    
    // Камера для вида сверху-сбоку
    // Увеличиваем FOV и отодвигаем камеру, чтобы враги не обрезались при отлете
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.set(0, 1.8, 5);
    this.camera.lookAt(0, 0, 0);
    
    console.log('[Enemy3DManager] Camera position:', this.camera.position);
    console.log('[Enemy3DManager] Camera looking at: 0,0,0');

    // WebGL рендерер
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true 
    });
    this.renderer.setSize(128, 128);
    this.renderer.setClearColor(0x000000, 0); // Прозрачный фон

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
    backLight.position.set(-5, 5, -5);
    this.scene.add(backLight);
    
    console.log('[Enemy3DManager] Lights added:', this.scene.children.length);
    
    // Загружаем базовую модель
    this.loadModel();
  }

  private async loadModel() {
    try {
      console.log('[Enemy3DManager] Starting to load base model...');
      
      // Загружаем базовую модель паука
      this.baseModel = await loadSpiderModel();
      this.isModelLoaded = true;
      
      console.log('[Enemy3DManager] Base model loaded successfully!');
    } catch (error) {
      console.error('[Enemy3DManager] Failed to load base model:', error);
    }
  }

  // Создаем новую модель для врага
  private createEnemyModel(config: EnemyModelConfig): THREE.Group {
    if (!this.baseModel) {
      throw new Error('Base model not loaded');
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
    
    // Применяем масштаб из конфигурации
    enemyGroup.scale.set(config.scale, config.scale, config.scale);
    
    // Добавляем модель в группу
    enemyGroup.add(modelClone);
    
    return enemyGroup;
  }

  // Получаем или создаем модель для врага
  public getOrCreateEnemy(enemyId: string, config: EnemyModelConfig): THREE.Group | null {
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
      this.scene.add(enemyModel);

      // Сохраняем состояние врага
      this.enemies.set(enemyId, {
        model: enemyModel,
        animationTime: 0,
        isDying: false,
        deathStartTime: 0,
        deathDuration: config.animations.death.duration,
        fadeOutDuration: config.animations.death.fadeOutDuration,
        config,
      });

      return enemyModel;
    } catch (error) {
      console.error('[Enemy3DManager] Failed to create enemy model:', error);
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
    enemy.deathStartTime = deathStartTime ?? (Date.now() / 1000);
    
    // Генерируем случайный вектор отлета
    const knockbackDistance = enemy.config.animations.death.knockbackDistance || 0;
    if (knockbackDistance > 0) {
      const angle = Math.random() * Math.PI * 2; // Случайный угол
      const distance = knockbackDistance * (0.5 + Math.random() * 0.5); // От 50% до 100% расстояния
      enemy.knockbackOffset = {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
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

  // Рендерим модель с заданным поворотом и обновляем анимацию
  public render(enemyId: string, rotation: number, deltaTime: number, gameSpeed: number = 1): HTMLCanvasElement | null {
    if (!this.isModelLoaded || !this.baseModel) {
      return null;
    }

    const enemy = this.enemies.get(enemyId);
    if (!enemy) {
      return null;
    }

    const { model, config, isDying, deathStartTime, deathDuration, fadeOutDuration } = enemy;
    const spiderModel = model.children[0];
    
    if (!spiderModel) {
      return null;
    }

    // СКРЫВАЕМ ВСЕ модели кроме текущей
    this.enemies.forEach((e, id) => {
      e.model.visible = (id === enemyId);
    });

    if (isDying) {
      // Анимация смерти
      const currentTime = Date.now() / 1000;
      const deathProgress = Math.min((currentTime - deathStartTime) / deathDuration, 1);
      
      // Применяем отлет (knockback) к внутренней модели
      // Делим на scale чтобы смещение было в локальных координатах модели
      if (enemy.knockbackOffset) {
        spiderModel.position.x = (enemy.knockbackOffset.x / config.scale) * deathProgress;
        spiderModel.position.z = (enemy.knockbackOffset.y / config.scale) * deathProgress;
      }
      
      if (config.animations.death.flipOver) {
        // Переворачивание на спину (паук)
        // Случайное направление при переворачивании
        const rotationOffset = config.rotationOffset || 0;
        const randomRotation = enemy.knockbackOffset ? Math.atan2(enemy.knockbackOffset.y, enemy.knockbackOffset.x) : Math.random() * Math.PI * 2;
        spiderModel.rotation.y = randomRotation + rotationOffset;
        // Поворот на 180° вокруг оси X (переворот на спину)
        spiderModel.rotation.x = deathProgress * Math.PI;
      }
      
      if (config.animations.death.shrink) {
        // Уменьшение
        const shrinkScale = 1 - deathProgress * 0.5;
        model.scale.set(config.scale * shrinkScale, config.scale * shrinkScale, config.scale * shrinkScale);
      }
      
      // Фаза растворения после смерти
      if (deathProgress >= 1) {
        const fadeProgress = Math.min((currentTime - deathStartTime - deathDuration) / fadeOutDuration, 1);
        
        // Уменьшаем прозрачность
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                mat.transparent = true;
                mat.opacity = 1 - fadeProgress;
              });
            } else {
              child.material.transparent = true;
              child.material.opacity = 1 - fadeProgress;
            }
          }
        });
      }
    } else {
      // Обычная анимация ходьбы
      const walkConfig = config.animations.walk;
      
      // Поворот по направлению движения применяем к spiderModel (как в master)
      const rotationOffset = config.rotationOffset || 0;
      spiderModel.rotation.y = -rotation + Math.PI / 2 + rotationOffset;
      
      // Сбрасываем rotation.x на случай если враг был в состоянии смерти
      spiderModel.rotation.x = 0;
      
      // Процедурная анимация (всегда применяем, как в master)
      // Умножаем на gameSpeed чтобы анимация коррелировала со скоростью игры
      enemy.animationTime += deltaTime * (walkConfig.speed || 8) * gameSpeed;
      
      // Покачивание вверх-вниз
      const bobAmount = walkConfig.bobAmount !== undefined ? walkConfig.bobAmount : 0.05;
      spiderModel.position.y = Math.sin(enemy.animationTime) * bobAmount;
      
      // Покачивание из стороны в сторону
      const swayAmount = walkConfig.swayAmount !== undefined ? walkConfig.swayAmount : 0.12;
      spiderModel.position.x = Math.sin(enemy.animationTime * 0.5) * swayAmount;
      
      // Наклон при движении
      const tiltAmount = walkConfig.tiltAmount !== undefined ? walkConfig.tiltAmount : 0.15;
      spiderModel.rotation.z = Math.sin(enemy.animationTime * 0.7) * tiltAmount;
    }
    
    // Обновляем анимацию (если есть)
    if (this.baseModel.mixer) {
      this.baseModel.mixer.update(deltaTime);
    }

    // Рендерим сцену
    this.renderer.render(this.scene, this.camera);
    
    // Возвращаем canvas элемент
    return this.renderer.domElement;
  }

  // Удаляем врага полностью
  public removeEnemy(enemyId: string) {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      this.scene.remove(enemy.model);
      this.enemies.delete(enemyId);
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

// Основной компонент для отображения всех врагов
export function Enemy3DRenderer() {
  return null; // Рендеринг происходит через GameCanvas
}
