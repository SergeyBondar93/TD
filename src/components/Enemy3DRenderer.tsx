import * as THREE from 'three';
import { loadSpiderModel } from '../utils/modelLoader';
import type { LoadedModel } from '../utils/modelLoader';
import { useState, useEffect } from 'react';

// Класс для управления 3D рендерингом врагов
class Enemy3DManager {
  private baseModel: LoadedModel | null = null;
  private isModelLoaded = false;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private currentModel: THREE.Group | null = null;
  private animationTime = 0; // Для процедурной анимации

  constructor() {
    console.log('[Enemy3DManager] Constructor called');
    
    // Создаём Three.js сцену
    this.scene = new THREE.Scene();
    this.scene.background = null; // Прозрачный фон
    
    // Камера для вида сверху-сбоку
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 1.5, 4);
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
    
    // Загружаем модель
    this.loadModel();
  }

  private async loadModel() {
    try {
      console.log('[Enemy3DManager] Starting to load model...');
      
      // Загружаем модель паука
      this.baseModel = await loadSpiderModel();
      
      // Клонируем модель правильно (глубокое клонирование)
      const modelClone = this.baseModel.scene.clone(true);
      
      // Вычисляем bounding box модели чтобы центрировать её
      const box = new THREE.Box3().setFromObject(modelClone);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      console.log('[Enemy3DManager] Spider Model size:', size);
      console.log('[Enemy3DManager] Spider Model center:', center);
      console.log('[Enemy3DManager] Spider Model bbox min:', box.min);
      console.log('[Enemy3DManager] Spider Model bbox max:', box.max);
      
      // Создаем группу для модели
      this.currentModel = new THREE.Group();
      
      // Центрируем модель только по X и Z, оставляем Y=0 чтобы модель стояла на полу
      modelClone.position.set(-center.x, -box.min.y, -center.z);
      
      // НЕ применяем масштаб здесь - пусть контроллер управляет масштабом
      // Пользователь сможет настроить масштаб через ModelPositionController
      const maxDimension = Math.max(size.x, size.y, size.z);
      console.log('[Enemy3DManager] Max dimension:', maxDimension, 'Model ready for scaling via controller');
      
      // Добавляем модель в группу
      this.currentModel.add(modelClone);
      
      // Применяем начальный масштаб сразу
      this.currentModel.scale.set(0.02, 0.02, 0.02);
      
      // Добавляем тестовый куб для проверки
      const testCube = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      testCube.position.set(0, 0, 0);
      this.currentModel.add(testCube);
      console.log('[Enemy3DManager] Added test cube at 0,0,0');
      
      // Добавляем группу в сцену
      this.scene.add(this.currentModel);
      
      // Проверяем, что модель действительно добавлена
      console.log('[Enemy3DManager] Scene children count:', this.scene.children.length);
      console.log('[Enemy3DManager] Current model children:', this.currentModel.children.length);
      
      // Обходим все дочерние объекты и проверяем их
      let meshCount = 0;
      this.currentModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshCount++;
          console.log('[Enemy3DManager] Found mesh:', child.name, 'visible:', child.visible);
          console.log('[Enemy3DManager] Mesh geometry vertices:', child.geometry.attributes.position?.count);
          
          // Убеждаемся что mesh видим и имеет правильные настройки
          child.visible = true;
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Оставляем оригинальный материал с текстурами
          console.log('[Enemy3DManager] Mesh has material:', child.material);
          
          // Если материал - это MeshPhongMaterial, оставляем его как есть
          // Текстуры уже загружены из MTL файла
        }
      });
      
      console.log('[Enemy3DManager] Total meshes found:', meshCount);
      
      this.isModelLoaded = true;
      console.log('[Enemy3DManager] Model loaded and added to scene!');
      
      /* ВРЕМЕННО ЗАКОММЕНТИРОВАНО: Создаем простую тестовую модель вместо загрузки волка
      // Создаем простого "волка" из геометрических примитивов
      this.currentModel = new THREE.Group();
      
      // Тело (вытянутый куб)
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.9, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x808080 })
      );
      body.position.set(0, 0, 0);
      this.currentModel.add(body);
      
      // Голова (куб меньше)
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.75, 0.75),
        new THREE.MeshStandardMaterial({ color: 0x606060 })
      );
      head.position.set(1.2, 0.3, 0);
      this.currentModel.add(head);
      
      // Морда (маленький вытянутый куб)
      const snout = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.3, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x505050 })
      );
      snout.position.set(1.65, 0.15, 0);
      this.currentModel.add(snout);
      
      // Уши (2 маленьких треугольника)
      const earGeometry = new THREE.ConeGeometry(0.24, 0.45, 3);
      const earMaterial = new THREE.MeshStandardMaterial({ color: 0x606060 });
      
      const leftEar = new THREE.Mesh(earGeometry, earMaterial);
      leftEar.position.set(1.05, 0.9, -0.3);
      leftEar.rotation.x = Math.PI;
      this.currentModel.add(leftEar);
      
      const rightEar = new THREE.Mesh(earGeometry, earMaterial);
      rightEar.position.set(1.05, 0.9, 0.3);
      rightEar.rotation.x = Math.PI;
      this.currentModel.add(rightEar);
      
      // Хвост (вытянутый конус)
      const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.75, 8),
        new THREE.MeshStandardMaterial({ color: 0x707070 })
      );
      tail.position.set(-1.05, 0.15, 0);
      tail.rotation.z = Math.PI / 2;
      this.currentModel.add(tail);
      
      // 4 ноги (маленькие цилиндры)
      const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.75, 8);
      const legMaterial = new THREE.MeshStandardMaterial({ color: 0x505050 });
      
      const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
      frontLeftLeg.position.set(0.6, -0.75, -0.36);
      this.currentModel.add(frontLeftLeg);
      
      const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
      frontRightLeg.position.set(0.6, -0.75, 0.36);
      this.currentModel.add(frontRightLeg);
      
      const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
      backLeftLeg.position.set(-0.6, -0.75, -0.36);
      this.currentModel.add(backLeftLeg);
      
      const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
      backRightLeg.position.set(-0.6, -0.75, 0.36);
      this.currentModel.add(backRightLeg);
      
      // Добавляем группу в сцену
      this.scene.add(this.currentModel);
      
      // Создаем фейковый baseModel для mixer (пустой, без анимаций)
      this.baseModel = {
        scene: this.currentModel,
        animations: [],
        mixer: new THREE.AnimationMixer(this.currentModel)
      };
      
      this.isModelLoaded = true;
      console.log('[Enemy3DManager] Test model created and added to scene!');
      */
      
    } catch (error) {
      console.error('[Enemy3DManager] Failed to load wolf model:', error);
    }
  }

  // Рендерим модель с заданным поворотом и обновляем анимацию
  public render(enemyId: string, rotation: number, deltaTime: number): HTMLCanvasElement | null {
    if (!this.isModelLoaded || !this.currentModel || !this.baseModel) {
      // console.log('[Enemy3DManager] Cannot render - model not loaded');
      return null;
    }

    // Поворачиваем только модель паука (первый ребенок), не куб
    // Добавляем Math.PI чтобы паук смотрел вперед, а не назад
    const spiderModel = this.currentModel.children[0];
    if (spiderModel) {
      spiderModel.rotation.y = -rotation + Math.PI / 2 + Math.PI;
      
      // Процедурная анимация: покачивание при движении
      this.animationTime += deltaTime * 8; // Скорость анимации
      
      // Покачивание вверх-вниз (имитация шагов)
      const bobAmount = 0.05;
      spiderModel.position.y = Math.sin(this.animationTime) * bobAmount;
      
      // Легкое покачивание из стороны в сторону
      const swayAmount = 0.12;
      spiderModel.position.x = Math.sin(this.animationTime * 0.5) * swayAmount;
      
      // Небольшой наклон при движении
      const tiltAmount = 0.15;
      spiderModel.rotation.z = Math.sin(this.animationTime * 0.7) * tiltAmount;
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

  // Удаляем renderer для врага, который был уничтожен
  public removeEnemy(enemyId: string) {
    // В этой простой версии ничего не делаем
  }

  public isLoaded(): boolean {
    return this.isModelLoaded;
  }

  public dispose() {
    this.renderer.dispose();
  }

  // Методы для управления камерой и моделью
  public setCameraPosition(x: number, y: number, z: number) {
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  public setModelPosition(x: number, y: number, z: number) {
    if (this.currentModel) {
      this.currentModel.position.set(x, y, z);
    }
  }

  public setModelScale(scale: number) {
    if (this.currentModel) {
      this.currentModel.scale.set(scale, scale, scale);
    }
  }

  public getCameraPosition() {
    return this.camera.position.clone();
  }

  public getModelPosition() {
    return this.currentModel ? this.currentModel.position.clone() : new THREE.Vector3(0, 0, 0);
  }

  public getModelScale() {
    return this.currentModel ? this.currentModel.scale.x : 1;
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

// Компонент контроллера для настройки позиции модели
export function ModelPositionController() {
  const manager = getEnemy3DManager();
  
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 1.5, z: 4 });
  const [modelPos, setModelPos] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState(0.02);  // Начальный масштаб для OBJ модели

  const updateCamera = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPos = { ...cameraPos, [axis]: value };
    setCameraPos(newPos);
    manager.setCameraPosition(newPos.x, newPos.y, newPos.z);
  };

  const updateModel = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPos = { ...modelPos, [axis]: value };
    setModelPos(newPos);
    manager.setModelPosition(newPos.x, newPos.y, newPos.z);
  };

  const updateScale = (value: number) => {
    setScale(value);
    manager.setModelScale(value);
  };

  // Применяем начальный масштаб при монтировании компонента
  useEffect(() => {
    manager.setModelScale(scale);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 10000,
      background: 'rgba(0, 0, 0, 0.85)',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '12px',
      minWidth: '250px'
    }}>
      <div style={{ marginBottom: '15px', fontWeight: 'bold', fontSize: '14px' }}>
        📐 Model Position Controller
      </div>

      {/* Camera Position */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#4fc3f7', marginBottom: '6px' }}>Camera Position:</div>
        <div style={{ marginLeft: '10px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>
            X: {cameraPos.x.toFixed(2)}
            <input
              type="range"
              min="-10"
              max="10"
              step="0.1"
              value={cameraPos.x}
              onChange={(e) => updateCamera('x', parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '4px' }}>
            Y: {cameraPos.y.toFixed(2)}
            <input
              type="range"
              min="-5"
              max="10"
              step="0.1"
              value={cameraPos.y}
              onChange={(e) => updateCamera('y', parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </label>
          <label style={{ display: 'block' }}>
            Z: {cameraPos.z.toFixed(2)}
            <input
              type="range"
              min="-10"
              max="10"
              step="0.1"
              value={cameraPos.z}
              onChange={(e) => updateCamera('z', parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </label>
        </div>
      </div>

      {/* Model Position */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#81c784', marginBottom: '6px' }}>Model Position:</div>
        <div style={{ marginLeft: '10px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>
            X: {modelPos.x.toFixed(2)}
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={modelPos.x}
              onChange={(e) => updateModel('x', parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '4px' }}>
            Y: {modelPos.y.toFixed(2)}
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={modelPos.y}
              onChange={(e) => updateModel('y', parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </label>
          <label style={{ display: 'block' }}>
            Z: {modelPos.z.toFixed(2)}
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={modelPos.z}
              onChange={(e) => updateModel('z', parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </label>
        </div>
      </div>

      {/* Scale */}
      <div>
        <div style={{ color: '#ffb74d', marginBottom: '6px' }}>Scale:</div>
        <div style={{ marginLeft: '10px' }}>
          <label style={{ display: 'block' }}>
            {scale.toFixed(3)}
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={scale}
              onChange={(e) => updateScale(parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
