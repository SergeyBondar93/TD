import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { loadSoldierModel } from "../utils/modelLoader";
import { SOLDIER_MODEL, SPIDER_MODEL, type EnemyModelConfig } from "../config/gameData/enemies";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../types/game";

interface ModelDebugSceneProps {
  onClose?: () => void;
}

export const ModelDebugScene: React.FC<ModelDebugSceneProps> = ({ onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const boxHelperRef = useRef<THREE.BoxHelper | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedConfig, setSelectedConfig] = useState<"soldier" | "spider">("soldier");
  const [configScale, setConfigScale] = useState(100);
  const [sizeScale, setSizeScale] = useState(100);

  // Обновляем configScale при изменении выбранной конфигурации
  useEffect(() => {
    const config = selectedConfig === "soldier" ? SOLDIER_MODEL : SPIDER_MODEL;
    setConfigScale(config.scale);
  }, [selectedConfig]);
  const [rotation, setRotation] = useState(0);
  const [showBox, setShowBox] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [cameraDistance, setCameraDistance] = useState(500);
  const [cameraAngle, setCameraAngle] = useState(45);

  // Инициализация Three.js сцены
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Создаём сцену
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    // Создаём камеру
    const camera = new THREE.PerspectiveCamera(
      50,
      CANVAS_WIDTH / CANVAS_HEIGHT,
      0.1,
      2000
    );
    const initialAngleRad = (cameraAngle * Math.PI) / 180;
    const initialHeight = cameraDistance * Math.sin(initialAngleRad);
    const initialHorizontalDist = cameraDistance * Math.cos(initialAngleRad);
    camera.position.set(0, initialHeight, initialHorizontalDist);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    console.log('[ModelDebugScene] Камера инициализирована:', {
      position: camera.position,
      distance: cameraDistance,
      angle: cameraAngle
    });

    // Создаём рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 500, 200);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Создаём плоскость для отображения модели
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x16213e,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Добавляем тестовый куб для проверки сцены
    const testCubeGeometry = new THREE.BoxGeometry(50, 50, 50);
    const testCubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const testCube = new THREE.Mesh(testCubeGeometry, testCubeMaterial);
    testCube.position.set(100, 25, 0);
    testCube.castShadow = true;
    scene.add(testCube);
    console.log('[ModelDebugScene] Тестовый куб добавлен для проверки сцены');

    setIsInitialized(true);

    // Cleanup
    return () => {
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Загрузка и создание модели
  useEffect(() => {
    if (!isInitialized || !sceneRef.current) return;

    const scene = sceneRef.current;
    const config = selectedConfig === "soldier" ? SOLDIER_MODEL : SPIDER_MODEL;

    // Удаляем старую модель
    if (modelRef.current) {
      scene.remove(modelRef.current);
      modelRef.current = null;
    }
    if (boxHelperRef.current) {
      scene.remove(boxHelperRef.current);
      boxHelperRef.current = null;
    }

    setModelLoaded(false);

    // Загружаем модель
    console.log('[ModelDebugScene] Начинаю загрузку модели...');
    loadSoldierModel()
      .then((loadedModel) => {
        console.log('[ModelDebugScene] Модель загружена, клонирую...');
        
        // Клонируем базовую модель
        const modelClone = loadedModel.scene.clone(true);
        
        // Убеждаемся, что модель видима и материалы правильно настроены
        let meshCount = 0;
        modelClone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshCount++;
            child.visible = true;
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  if (mat instanceof THREE.Material) {
                    mat.visible = true;
                    mat.transparent = false;
                    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                      mat.opacity = 1.0;
                    }
                  }
                });
              } else if (child.material instanceof THREE.Material) {
                child.material.visible = true;
                child.material.transparent = false;
                if (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshBasicMaterial) {
                  child.material.opacity = 1.0;
                }
              }
            }
          }
        });
        console.log('[ModelDebugScene] Найдено мешей в модели:', meshCount);
        
        // Вычисляем bounding box для центрирования
        const box = new THREE.Box3().setFromObject(modelClone);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const height = size.y;

        console.log('[ModelDebugScene] Оригинальный размер модели:', size);
        console.log('[ModelDebugScene] Оригинальный центр:', center);

        // Создаем группу-контейнер для модели
        const modelGroup = new THREE.Group();
        modelGroup.visible = true;

        // Центрируем модель так, чтобы нижняя часть была на y=0
        modelClone.position.set(-center.x, -box.min.y, -center.z);

        // Применяем scale (как в Enemy3DRenderer)
        // В Enemy3DRenderer: configScale = config.scale / 20
        // Например, если config.scale = 100, то configScaleFactor = 5.0
        // Если config.scale = 40, то configScaleFactor = 2.0
        const configScaleFactor = configScale / 20; // Например, 100% = 5.0, 40% = 2.0
        const sizeScaleFactor = sizeScale / 100; // Например, 100 = 1.0
        const totalScale = configScaleFactor * sizeScaleFactor;

        console.log('[ModelDebugScene] Применяю scale:', {
          configScale,
          configScaleFactor: configScaleFactor.toFixed(3),
          sizeScale,
          sizeScaleFactor: sizeScaleFactor.toFixed(3),
          totalScale: totalScale.toFixed(3),
          originalSize: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) }
        });

        // Применяем scale к клонированной модели
        modelClone.scale.set(totalScale, totalScale, totalScale);
        
        // Проверяем размер после масштабирования
        const scaledBox = new THREE.Box3().setFromObject(modelClone);
        const scaledSize = scaledBox.getSize(new THREE.Vector3());
        console.log('[ModelDebugScene] Размер после масштабирования:', {
          x: scaledSize.x.toFixed(2),
          y: scaledSize.y.toFixed(2),
          z: scaledSize.z.toFixed(2),
          '⚠️ ВНИМАНИЕ: Модель очень маленькая!': scaledSize.x < 10 && scaledSize.y < 10
        });
        
        // Если модель слишком маленькая, предупреждаем
        if (scaledSize.x < 5 || scaledSize.y < 5) {
          console.warn('[ModelDebugScene] ⚠️ Модель очень маленькая! Попробуйте увеличить Size Scale до 200-500%');
        }

        // Добавляем модель в группу
        modelGroup.add(modelClone);

        // Применяем поворот
        modelGroup.rotation.y = (rotation * Math.PI) / 180;

        // Добавляем в сцену
        scene.add(modelGroup);
        modelRef.current = modelGroup;

        // Вычисляем финальный bounding box после всех трансформаций
        const finalBox = new THREE.Box3().setFromObject(modelGroup);
        const finalSize = finalBox.getSize(new THREE.Vector3());
        const finalCenter = finalBox.getCenter(new THREE.Vector3());

        console.log('[ModelDebugScene] Модель добавлена в сцену:', {
          children: scene.children.length,
          modelGroupChildren: modelGroup.children.length,
          modelCloneChildren: modelClone.children.length,
          modelGroupPosition: modelGroup.position,
          finalSize,
          finalCenter
        });

        // Добавляем маркер в центре модели для визуализации (большой, чтобы было видно)
        const markerSize = Math.max(20, Math.max(finalSize.x, finalSize.y, finalSize.z) * 0.2);
        const markerGeometry = new THREE.SphereGeometry(markerSize, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(finalCenter);
        scene.add(marker);
        console.log('[ModelDebugScene] Зеленый маркер добавлен в центр модели:', finalCenter, 'размер:', markerSize);
        
        // Добавляем еще один маркер в начале координат для проверки
        const originMarkerGeometry = new THREE.SphereGeometry(20, 16, 16);
        const originMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.7 });
        const originMarker = new THREE.Mesh(originMarkerGeometry, originMarkerMaterial);
        originMarker.position.set(0, 0, 0);
        scene.add(originMarker);
        console.log('[ModelDebugScene] Синий маркер добавлен в начало координат (0,0,0)');
        
        // Добавляем визуализацию размеров модели (wireframe box)
        const wireframeBox = new THREE.BoxHelper(modelGroup, 0xffff00);
        scene.add(wireframeBox);
        console.log('[ModelDebugScene] Желтый wireframe box добавлен для визуализации размеров модели');

        // Обновляем отладочную информацию (используем уже вычисленные значения)

        setDebugInfo({
          originalSize: {
            x: size.x.toFixed(2),
            y: size.y.toFixed(2),
            z: size.z.toFixed(2),
          },
          originalCenter: {
            x: center.x.toFixed(2),
            y: center.y.toFixed(2),
            z: center.z.toFixed(2),
          },
          finalSize: {
            x: finalSize.x.toFixed(2),
            y: finalSize.y.toFixed(2),
            z: finalSize.z.toFixed(2),
          },
          finalCenter: {
            x: finalCenter.x.toFixed(2),
            y: finalCenter.y.toFixed(2),
            z: finalCenter.z.toFixed(2),
          },
          configScale: configScale.toFixed(1),
          sizeScale: sizeScale.toFixed(1),
          totalScale: totalScale.toFixed(3),
          configScaleFactor: configScaleFactor.toFixed(3),
          sizeScaleFactor: sizeScaleFactor.toFixed(3),
          rotation: rotation.toFixed(1),
          modelClonePosition: {
            x: modelClone.position.x.toFixed(2),
            y: modelClone.position.y.toFixed(2),
            z: modelClone.position.z.toFixed(2),
          },
          children: modelClone.children.length,
        });

        setModelLoaded(true);
      })
      .catch((error) => {
        console.error("[ModelDebugScene] ❌ Ошибка загрузки модели:", error);
        setDebugInfo({
          error: error.message || String(error)
        });
      });
  }, [isInitialized, selectedConfig, configScale, sizeScale, rotation, showBox]);

  // Обновление камеры
  useEffect(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const angleRad = (cameraAngle * Math.PI) / 180;
    const height = cameraDistance * Math.sin(angleRad);
    const horizontalDist = cameraDistance * Math.cos(angleRad);

    camera.position.set(0, height, horizontalDist);
    camera.lookAt(0, 0, 0);
  }, [cameraDistance, cameraAngle]);

  // Обновление helpers
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    const scene = sceneRef.current;

    // Grid helper
    if (showGrid) {
      if (!gridHelperRef.current) {
        const gridHelper = new THREE.GridHelper(1000, 50, 0x444444, 0x222222);
        gridHelper.position.y = 0;
        scene.add(gridHelper);
        gridHelperRef.current = gridHelper;
        console.log('[ModelDebugScene] Grid helper добавлен');
      }
    } else {
      if (gridHelperRef.current) {
        scene.remove(gridHelperRef.current);
        gridHelperRef.current = null;
        console.log('[ModelDebugScene] Grid helper удален');
      }
    }

    // Axes helper
    if (showAxes) {
      if (!axesHelperRef.current) {
        const axesHelper = new THREE.AxesHelper(200);
        axesHelper.position.y = 0;
        scene.add(axesHelper);
        axesHelperRef.current = axesHelper;
        console.log('[ModelDebugScene] Axes helper добавлен');
      }
    } else {
      if (axesHelperRef.current) {
        scene.remove(axesHelperRef.current);
        axesHelperRef.current = null;
        console.log('[ModelDebugScene] Axes helper удален');
      }
    }

    // Box helper - обновляем только если модель загружена
    // Примечание: BoxHelper уже добавляется при создании модели, здесь только управляем видимостью
    if (showBox && modelRef.current && modelLoaded) {
      // Ищем существующий BoxHelper в сцене
      const existingHelper = scene.children.find(
        (child) => child instanceof THREE.BoxHelper && child.object === modelRef.current
      ) as THREE.BoxHelper | undefined;
      
      if (!existingHelper) {
        // Удаляем старый helper если есть
        if (boxHelperRef.current) {
          scene.remove(boxHelperRef.current);
        }
        const boxHelper = new THREE.BoxHelper(modelRef.current, 0x00ff00);
        scene.add(boxHelper);
        boxHelperRef.current = boxHelper;
        console.log('[ModelDebugScene] Box helper добавлен для модели');
      } else {
        boxHelperRef.current = existingHelper;
        existingHelper.visible = true;
      }
    } else {
      if (boxHelperRef.current) {
        boxHelperRef.current.visible = showBox;
      }
    }
  }, [showGrid, showAxes, showBox, modelLoaded, isInitialized]);

  // Анимационный цикл
  useEffect(() => {
    if (!isInitialized) {
      console.log('[ModelDebugScene] Анимационный цикл не запущен: isInitialized = false');
      return;
    }

    let animationId: number;
    let frameCount = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      frameCount++;

      // Логируем каждые 60 кадров (примерно раз в секунду)
      if (frameCount % 60 === 0) {
        console.log('[ModelDebugScene] Рендеринг кадра:', {
          sceneChildren: sceneRef.current?.children.length || 0,
          hasModel: !!modelRef.current,
          hasRenderer: !!rendererRef.current,
          hasCamera: !!cameraRef.current
        });
      }

      // Обновляем BoxHelper если модель изменилась
      if (boxHelperRef.current && modelRef.current && showBox) {
        sceneRef.current?.remove(boxHelperRef.current);
        boxHelperRef.current = new THREE.BoxHelper(modelRef.current, 0x00ff00);
        sceneRef.current?.add(boxHelperRef.current);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    console.log('[ModelDebugScene] Запускаю анимационный цикл');
    animate();

    return () => {
      console.log('[ModelDebugScene] Останавливаю анимационный цикл');
      cancelAnimationFrame(animationId);
    };
  }, [isInitialized, modelLoaded, showBox]);

  return (
    <div style={{ position: "relative", width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
      <div
        ref={containerRef}
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          border: "2px solid #0f3460",
        }}
      />

      {/* Панель управления */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: "15px",
          borderRadius: "8px",
          color: "#fff",
          fontFamily: "monospace",
          fontSize: "12px",
          maxWidth: "400px",
          maxHeight: "90%",
          overflowY: "auto",
        }}
      >
        <div style={{ marginBottom: "15px", borderBottom: "1px solid #444", paddingBottom: "10px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#00ff00" }}>🔧 Дебаг модели</h3>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: "5px 10px",
                backgroundColor: "#ff4444",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Закрыть
            </button>
          )}
        </div>

        {/* Выбор конфигурации */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Конфигурация:</label>
          <select
            value={selectedConfig}
            onChange={(e) => setSelectedConfig(e.target.value as "soldier" | "spider")}
            style={{
              width: "100%",
              padding: "5px",
              backgroundColor: "#222",
              color: "#fff",
              border: "1px solid #444",
              borderRadius: "4px",
            }}
          >
            <option value="soldier">Soldier (100%)</option>
            <option value="spider">Spider (40%)</option>
          </select>
        </div>

        {/* Параметры scale */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Config Scale: {configScale}%
          </label>
          <input
            type="range"
            min="10"
            max="200"
            value={configScale}
            onChange={(e) => setConfigScale(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Size Scale: {sizeScale}%
          </label>
          <input
            type="range"
            min="10"
            max="500"
            value={sizeScale}
            onChange={(e) => setSizeScale(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <small style={{ color: "#aaa", fontSize: "10px" }}>
            💡 Если модель не видна, попробуйте увеличить до 200-500%
          </small>
        </div>

        {/* Поворот */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Rotation: {rotation}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {/* Камера */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Camera Distance: {cameraDistance}
          </label>
          <input
            type="range"
            min="100"
            max="1000"
            value={cameraDistance}
            onChange={(e) => setCameraDistance(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Camera Angle: {cameraAngle}°
          </label>
          <input
            type="range"
            min="0"
            max="90"
            value={cameraAngle}
            onChange={(e) => setCameraAngle(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {/* Helpers */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
            <input
              type="checkbox"
              checked={showBox}
              onChange={(e) => setShowBox(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Показать Bounding Box
          </label>
          <label style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Показать сетку
          </label>
          <label style={{ display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showAxes}
              onChange={(e) => setShowAxes(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Показать оси
          </label>
        </div>

        {/* Отладочная информация */}
        {debugInfo && (
          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#111",
              borderRadius: "4px",
              border: "1px solid #444",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0", color: "#00ffff" }}>Отладочная информация:</h4>
            <div style={{ lineHeight: "1.6" }}>
              <div><strong>Оригинальный размер:</strong> {debugInfo.originalSize.x} × {debugInfo.originalSize.y} × {debugInfo.originalSize.z}</div>
              <div><strong>Оригинальный центр:</strong> ({debugInfo.originalCenter.x}, {debugInfo.originalCenter.y}, {debugInfo.originalCenter.z})</div>
              <div style={{ marginTop: "5px" }}><strong>Финальный размер:</strong> {debugInfo.finalSize.x} × {debugInfo.finalSize.y} × {debugInfo.finalSize.z}</div>
              <div><strong>Финальный центр:</strong> ({debugInfo.finalCenter.x}, {debugInfo.finalCenter.y}, {debugInfo.finalCenter.z})</div>
              <div style={{ marginTop: "5px" }}><strong>Config Scale:</strong> {debugInfo.configScale}% (factor: {debugInfo.configScaleFactor})</div>
              <div><strong>Size Scale:</strong> {debugInfo.sizeScale}% (factor: {debugInfo.sizeScaleFactor})</div>
              <div><strong>Total Scale:</strong> {debugInfo.totalScale}</div>
              <div style={{ marginTop: "5px" }}><strong>Rotation:</strong> {debugInfo.rotation}°</div>
              <div><strong>Model Position:</strong> ({debugInfo.modelClonePosition.x}, {debugInfo.modelClonePosition.y}, {debugInfo.modelClonePosition.z})</div>
              <div><strong>Children:</strong> {debugInfo.children}</div>
              <div style={{ marginTop: "5px", color: modelLoaded ? "#00ff00" : "#ff4444" }}>
                <strong>Статус:</strong> {modelLoaded ? "✅ Модель загружена и отображается" : "⏳ Загрузка..."}
              </div>
            </div>
          </div>
        )}

        {/* Информация о сцене */}
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#111",
            borderRadius: "4px",
            border: "1px solid #444",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#00ffff" }}>Информация о сцене:</h4>
          <div style={{ lineHeight: "1.6", fontSize: "11px" }}>
            <div><strong>Инициализирована:</strong> {isInitialized ? "✅ Да" : "❌ Нет"}</div>
            <div><strong>Модель загружена:</strong> {modelLoaded ? "✅ Да" : "❌ Нет"}</div>
            <div><strong>Камера позиция:</strong> ({cameraDistance.toFixed(0)}, {cameraAngle.toFixed(0)}°)</div>
            <div><strong>Показывать сетку:</strong> {showGrid ? "✅" : "❌"}</div>
            <div><strong>Показывать оси:</strong> {showAxes ? "✅" : "❌"}</div>
            <div><strong>Показывать Box:</strong> {showBox ? "✅" : "❌"}</div>
          </div>
        </div>

        {!modelLoaded && !debugInfo?.error && (
          <div style={{ marginTop: "15px", color: "#ffaa00" }}>Загрузка модели...</div>
        )}
        
        {debugInfo?.error && (
          <div style={{ marginTop: "15px", color: "#ff4444", padding: "10px", backgroundColor: "#330000", borderRadius: "4px" }}>
            <strong>Ошибка загрузки:</strong> {debugInfo.error}
            <br />
            <small>Проверьте консоль для подробностей</small>
          </div>
        )}
      </div>
    </div>
  );
};

