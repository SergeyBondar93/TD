import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

// Список всех моделей из public/models/gltf
const MODEL_PATHS = [
  // .glb файлы в корне
  "/models/gltf/AnisotropyBarnLamp.glb",
  "/models/gltf/bath_day.glb",
  "/models/gltf/BoomBox.glb",
  "/models/gltf/coffeemat.glb",
  "/models/gltf/coffeeMug.glb",
  "/models/gltf/collision-world.glb",
  "/models/gltf/DispersionTest.glb",
  "/models/gltf/DragonAttenuation.glb",
  "/models/gltf/duck.glb",
  "/models/gltf/dungeon_warkarma.glb",
  "/models/gltf/facecap.glb",
  "/models/gltf/ferrari.glb",
  "/models/gltf/Flamingo.glb",
  "/models/gltf/gears.glb",
  "/models/gltf/Horse.glb",
  "/models/gltf/IridescenceLamp.glb",
  "/models/gltf/IridescentDishWithOlives.glb",
  "/models/gltf/kira.glb",
  "/models/gltf/LittlestTokyo.glb",
  "/models/gltf/Michelle.glb",
  "/models/gltf/minimalistic_modern_bedroom.glb",
  "/models/gltf/nemetona.glb",
  "/models/gltf/Parrot.glb",
  "/models/gltf/pool.glb",
  "/models/gltf/PrimaryIonDrive.glb",
  "/models/gltf/readyplayer.me.glb",
  "/models/gltf/rolex.glb",
  "/models/gltf/ShaderBall.glb",
  "/models/gltf/ShaderBall2.glb",
  "/models/gltf/ShadowmappableMesh.glb",
  "/models/gltf/SheenChair.glb",
  "/models/gltf/Soldier.glb",
  "/models/gltf/space_ship_hallway.glb",
  "/models/gltf/steampunk_camera.glb",
  "/models/gltf/Stork.glb",
  "/models/gltf/venice_mask.glb",
  "/models/gltf/Xbot.glb",
  // Модели в подпапках
  "/models/gltf/AnimatedMorphSphere/glTF/AnimatedMorphSphere.gltf",
  "/models/gltf/AVIFTest/forest_house.glb",
  "/models/gltf/ClearcoatTest/ClearcoatTest.glb",
  "/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf",
  "/models/gltf/Flower/Flower.glb",
  "/models/gltf/LeePerrySmith/LeePerrySmith.glb",
  "/models/gltf/MaterialsVariantsShoe/glTF/MaterialsVariantsShoe.gltf",
  "/models/gltf/Nefertiti/Nefertiti.glb",
  "/models/gltf/RobotExpressive/RobotExpressive.glb",
];


export const ModelViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const animationActionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [animations, setAnimations] = useState<THREE.AnimationClip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug controls state
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState(1.0);

  // Инициализация Three.js сцены
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Проверяем, не создан ли уже renderer (защита от двойного вызова в StrictMode)
    if (rendererRef.current) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Функция инициализации renderer
    const initRenderer = () => {
      if (!canvasRef.current) return;
      
      // Если renderer уже создан, не создаем новый
      if (rendererRef.current) return;
      
      // Получаем размеры контейнера
      const container = canvasRef.current;
      let width = container.clientWidth;
      let height = container.clientHeight;
      
      // Если размеры не определены, используем значения по умолчанию
      if (!width || width < 100) width = 800;
      if (!height || height < 100) height = 600;

      // Проверяем, нет ли уже canvas в контейнере
      if (container.querySelector('canvas')) {
        console.warn('Canvas already exists in container');
        return;
      }

      const camera = new THREE.PerspectiveCamera(
        45,
        width / height,
        0.1,
        2000
      );
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Добавляем canvas в контейнер
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Создаем OrbitControls для вращения камеры мышью
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; // Плавное движение
      controls.dampingFactor = 0.05;
      controls.enableZoom = true; // Включить зум колесиком мыши
      controls.enablePan = false; // Отключить панорамирование
      controls.minDistance = 2; // Минимальное расстояние до модели
      controls.maxDistance = 50; // Максимальное расстояние до модели
      controls.target.set(0, 0, 0); // Центр вращения
      controls.update();
      controlsRef.current = controls;
      
      console.log('✅ Renderer initialized with size:', width, height);
    };

    // Инициализируем renderer после того, как DOM полностью готов
    // Используем requestAnimationFrame для гарантии, что размеры контейнера определены
    let rafId: number | null = null;
    const tryInit = () => {
      if (canvasRef.current && canvasRef.current.clientWidth > 0 && canvasRef.current.clientHeight > 0) {
        initRenderer();
      } else {
        // Если размеры еще не определены, пробуем еще раз
        rafId = requestAnimationFrame(tryInit);
      }
    };
    
    // Пробуем инициализировать сразу
    rafId = requestAnimationFrame(tryInit);
    
    // Также пробуем через небольшую задержку на случай, если requestAnimationFrame не сработал
    let timeoutId: NodeJS.Timeout | null = null;
    timeoutId = setTimeout(() => {
      if (!rendererRef.current && canvasRef.current) {
        initRenderer();
      }
    }, 200);

    // Освещение (создаем только если сцена существует)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Создаем плоскость для отображения модели
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x16213e,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Анимационный цикл
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const deltaTime = 0.016; // ~60 FPS
      if (mixerRef.current) {
        mixerRef.current.update(deltaTime);
      }

      // Обновляем контролы (для плавного движения с damping)
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Обработка изменения размера окна
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !canvasRef.current) return;
      const width = Math.max(canvasRef.current.clientWidth || 800, 400);
      const height = Math.max(canvasRef.current.clientHeight || 600, 400);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);
    
    // Используем ResizeObserver для отслеживания изменения размера контейнера
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      
      if (rendererRef.current) {
        const canvasElement = rendererRef.current.domElement;
        if (canvasRef.current && canvasElement && canvasRef.current.contains(canvasElement)) {
          canvasRef.current.removeChild(canvasElement);
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      if (sceneRef.current) {
        // Очищаем все объекты из сцены
        while(sceneRef.current.children.length > 0) {
          sceneRef.current.remove(sceneRef.current.children[0]);
        }
        sceneRef.current = null;
      }
      
      cameraRef.current = null;
    };
  }, []);

  // Загрузка модели
  const loadModel = async (modelPath: string) => {
    if (!sceneRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Удаляем предыдущую модель
      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        modelRef.current = null;
      }

      // Останавливаем все анимации
      animationActionsRef.current.forEach((action) => {
        action.stop();
        action.reset();
      });
      animationActionsRef.current.clear();
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }

      // Загружаем новую модель
      const loader = new GLTFLoader();
      
      // Настраиваем DRACOLoader для поддержки сжатых моделей
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
      loader.setDRACOLoader(dracoLoader);
      
      // Настраиваем KTX2Loader для поддержки KTX2 текстур
      const ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.181.2/examples/jsm/libs/basis/');
      loader.setKTX2Loader(ktx2Loader);
      
      const gltf = await new Promise<{
        scene: THREE.Group;
        animations: THREE.AnimationClip[];
      }>((resolve, reject) => {
        loader.load(
          modelPath,
          (gltf) => {
            // Очищаем загрузчики после загрузки
            dracoLoader.dispose();
            ktx2Loader.dispose();
            resolve(gltf);
          },
          undefined,
          (error) => {
            dracoLoader.dispose();
            ktx2Loader.dispose();
            reject(error);
          }
        );
      });

      const model = SkeletonUtils.clone(gltf.scene) as THREE.Group;
      
      // Настраиваем тени
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      sceneRef.current.add(model);
      modelRef.current = model;

      // Настраиваем анимации
      const animations = gltf.animations || [];
      setAnimations(animations);

      if (animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;

        animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          animationActionsRef.current.set(clip.name, action);
        });
      } else {
        mixerRef.current = null;
      }

      // Центрируем модель
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;

      model.position.sub(center);
      model.scale.set(scale, scale, scale);

      // Сбрасываем debug параметры
      setPosition({ x: 0, y: 0, z: 0 });
      setRotation({ x: 0, y: 0, z: 0 });
      setScale(1.0);

      setSelectedModel(modelPath);
    } catch (err) {
      console.error("Ошибка загрузки модели:", err);
      setError(`Ошибка загрузки модели: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Воспроизведение анимации
  const playAnimation = (animationName: string) => {
    if (!mixerRef.current) return;

    // Останавливаем все анимации
    animationActionsRef.current.forEach((action) => {
      action.stop();
      action.reset();
    });

    // Запускаем выбранную анимацию
    const action = animationActionsRef.current.get(animationName);
    if (action) {
      action.reset();
      action.play();
    }
  };

  // Применение debug параметров
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.position.set(position.x, position.y, position.z);
      modelRef.current.rotation.set(
        (rotation.x * Math.PI) / 180,
        (rotation.y * Math.PI) / 180,
        (rotation.z * Math.PI) / 180
      );
      modelRef.current.scale.set(scale, scale, scale);
    }
  }, [position, rotation, scale]);

  // Получаем имя модели из пути
  const getModelName = (path: string): string => {
    const parts = path.split("/");
    const filename = parts[parts.length - 1];
    return filename.replace(/\.(glb|gltf)$/, "");
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        height: "calc(100vh - 60px)", // Вычитаем высоту навигации
        backgroundColor: "#1a1a2e",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Список моделей */}
      <div
        style={{
          width: "50%",
          padding: "20px",
          overflowY: "auto",
          borderRight: "2px solid #0f3460",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#00ff00" }}>📦 Список моделей</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {MODEL_PATHS.map((path) => {
            const name = getModelName(path);
            const isSelected = selectedModel === path;
            return (
              <button
                key={path}
                onClick={() => loadModel(path)}
                disabled={isLoading}
                style={{
                  padding: "12px",
                  backgroundColor: isSelected ? "#0f3460" : "#16213e",
                  color: "#fff",
                  border: `2px solid ${isSelected ? "#00ff00" : "#0f3460"}`,
                  borderRadius: "4px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && !isSelected) {
                    e.currentTarget.style.backgroundColor = "#1a2a3a";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && !isSelected) {
                    e.currentTarget.style.backgroundColor = "#16213e";
                  }
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas и панель управления */}
      <div
        style={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Canvas */}
        <div
          ref={canvasRef}
          style={{
            flex: 1,
            borderBottom: "2px solid #0f3460",
            minHeight: "400px",
            width: "100%",
          }}
        />

        {/* Панель управления */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#16213e",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {isLoading && (
            <div style={{ color: "#00ff00", marginBottom: "10px" }}>
              ⏳ Загрузка модели...
            </div>
          )}
          {error && (
            <div style={{ color: "#ff0000", marginBottom: "10px" }}>
              ❌ {error}
            </div>
          )}

          {selectedModel && (
            <>
              <h3 style={{ marginTop: 0, color: "#00ff00" }}>
                🎬 Анимации ({animations.length})
              </h3>
              {animations.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  {animations.map((anim) => (
                    <button
                      key={anim.name}
                      onClick={() => playAnimation(anim.name)}
                      style={{
                        padding: "8px",
                        backgroundColor: "#0f3460",
                        color: "#fff",
                        border: "1px solid #00ff00",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ▶️ {anim.name} ({(anim.duration * 1000).toFixed(0)}ms)
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#888", marginBottom: "20px" }}>
                  У этой модели нет анимаций
                </div>
              )}

              <h3 style={{ marginTop: 0, color: "#00ff00" }}>🔧 Дебаг</h3>

              {/* Позиция X */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "12px",
                  }}
                >
                  Позиция X: {position.x.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={-10}
                  max={10}
                  step={0.1}
                  value={position.x}
                  onChange={(e) =>
                    setPosition({ ...position, x: Number(e.target.value) })
                  }
                  style={{ width: "100%" }}
                />
              </div>

              {/* Позиция Y */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "12px",
                  }}
                >
                  Позиция Y: {position.y.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={-10}
                  max={10}
                  step={0.1}
                  value={position.y}
                  onChange={(e) =>
                    setPosition({ ...position, y: Number(e.target.value) })
                  }
                  style={{ width: "100%" }}
                />
              </div>

              {/* Позиция Z */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "12px",
                  }}
                >
                  Позиция Z: {position.z.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={-10}
                  max={10}
                  step={0.1}
                  value={position.z}
                  onChange={(e) =>
                    setPosition({ ...position, z: Number(e.target.value) })
                  }
                  style={{ width: "100%" }}
                />
              </div>

              {/* Поворот X */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "12px",
                  }}
                >
                  Поворот X: {rotation.x.toFixed(1)}°
                </label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation.x}
                  onChange={(e) =>
                    setRotation({ ...rotation, x: Number(e.target.value) })
                  }
                  style={{ width: "100%" }}
                />
              </div>

              {/* Поворот Y */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "12px",
                  }}
                >
                  Поворот Y: {rotation.y.toFixed(1)}°
                </label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation.y}
                  onChange={(e) =>
                    setRotation({ ...rotation, y: Number(e.target.value) })
                  }
                  style={{ width: "100%" }}
                />
              </div>

              {/* Поворот Z */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "12px",
                  }}
                >
                  Поворот Z: {rotation.z.toFixed(1)}°
                </label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation.z}
                  onChange={(e) =>
                    setRotation({ ...rotation, z: Number(e.target.value) })
                  }
                  style={{ width: "100%" }}
                />
              </div>

              {/* Размер */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "12px",
                  }}
                >
                  Размер: {scale.toFixed(2)}x
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Кнопка сброса */}
              <button
                onClick={() => {
                  setPosition({ x: 0, y: 0, z: 0 });
                  setRotation({ x: 0, y: 0, z: 0 });
                  setScale(1.0);
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "#444",
                  color: "#fff",
                  border: "1px solid #666",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  marginTop: "8px",
                }}
              >
                🔄 Сбросить
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

