import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { loadWolfModel } from '../utils/modelLoader';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function ModelDebugViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Создаем сцену
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    sceneRef.current = scene;

    // Камера
    const camera = new THREE.PerspectiveCamera(
      75,
      800 / 600,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Рендерер
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    renderer.setSize(800, 600);
    renderer.setClearColor(0x222222);
    rendererRef.current = renderer;

    // OrbitControls для вращения камеры мышкой
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-10, 10, -10);
    scene.add(directionalLight2);

    // Добавляем сетку для ориентации
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Добавляем оси координат
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Загружаем модель
    loadWolfModel().then(loadedModel => {
      console.log('[ModelDebugViewer] Model loaded!', loadedModel);
      
      const model = loadedModel.scene.clone(true);
      
      // Вычисляем размеры модели
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      console.log('[ModelDebugViewer] Model size:', size);
      console.log('[ModelDebugViewer] Model center:', center);
      
      // Центрируем модель
      model.position.set(-center.x, -center.y, -center.z);
      
      // Добавляем BoxHelper для визуализации границ
      const boxHelper = new THREE.BoxHelper(model, 0x00ff00);
      scene.add(boxHelper);
      
      // Добавляем модель в сцену
      scene.add(model);
      modelRef.current = model;
      
      // Обходим все меши и логируем
      let meshCount = 0;
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshCount++;
          console.log('[ModelDebugViewer] Mesh:', child.name, 'Geometry:', child.geometry, 'Material:', child.material);
          
          // Показываем оригинальный материал
          child.visible = true;
        }
      });
      
      console.log('[ModelDebugViewer] Total meshes:', meshCount);
      
      // Настраиваем камеру чтобы смотреть на модель
      const maxDim = Math.max(size.x, size.y, size.z);
      camera.position.set(maxDim * 2, maxDim * 1.5, maxDim * 2);
      camera.lookAt(0, 0, 0);
      controls.update();
    }).catch(error => {
      console.error('[ModelDebugViewer] Failed to load model:', error);
    });

    // Анимационный цикл
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      controls.update();
      
      // Медленное вращение модели
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 10000,
      background: '#000',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    }}>
      <div style={{ 
        color: '#fff', 
        marginBottom: '10px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        Model Debug Viewer (используйте мышь для вращения)
      </div>
      <canvas ref={canvasRef} style={{ display: 'block', border: '2px solid #444' }} />
    </div>
  );
}
