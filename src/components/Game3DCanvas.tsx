import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import type { GameState, Enemy, Tower, Projectile } from "../types/game";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_PADDING,
  GAME_WIDTH,
  GAME_HEIGHT,
  EnemyType,
} from "../types/game";
import { getEnemy3DManager } from "./Enemy3DRenderer";
import { canPlaceTower } from "../core/logic/towers";
import { TOWER_STATS } from "../config/gameData/towers";

// Константы для управления камерой
const CAMERA_DISTANCE_MIN = 300; // Минимальная дистанция (приближение)
const CAMERA_DISTANCE_MAX = 1000; // Максимальная дистанция (отдаление)
const CAMERA_DISTANCE_DEFAULT = 1000; // Дистанция по умолчанию (отдалена)
const CAMERA_ANGLE_FAR = 85; // Угол камеры при отдалении
const CAMERA_ANGLE_NEAR = 10; // Угол камеры при приближении
const CAMERA_ANGLE_DEFAULT = 85; // Угол камеры по умолчанию
const CAMERA_TRANSITION_SPEED = 0.15; // Скорость плавного перехода камеры (0-1)

interface Game3DCanvasProps {
  gameState: GameState;
  onCanvasClick: (x: number, y: number) => void;
  onTowerClick: (towerId: string) => void;
  selectedTowerLevel: 1 | 2 | 3 | 4 | 5 | null;
  selectedTowerId: string | null;
  path: { x: number; y: number }[];
}

export const Game3DCanvas: React.FC<Game3DCanvasProps> = ({
  gameState,
  onCanvasClick,
  onTowerClick,
  selectedTowerLevel,
  selectedTowerId,
  path,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Camera control state (Warcraft 3 style)
  const cameraStateRef = useRef({
    distance: CAMERA_DISTANCE_DEFAULT, // Текущая дистанция от цели
    targetDistance: CAMERA_DISTANCE_DEFAULT, // Целевая дистанция (для плавного перехода)
    angle: CAMERA_ANGLE_DEFAULT, // Текущий угол в градусах
    targetAngle: CAMERA_ANGLE_DEFAULT, // Целевой угол (для плавного перехода)
    targetX: 0,
    targetZ: 0,
    dragStartX: 0,
    dragStartY: 0,
    dragStartTargetX: 0,
    dragStartTargetZ: 0,
  });

  // Храним 3D объекты врагов
  const enemyMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const enemyHPSpritesRef = useRef<Map<string, THREE.Sprite>>(new Map());
  const pathTurnPointsRef = useRef<Map<string, THREE.Sprite>>(new Map());
  const towerMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const towerArrowsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const towerRangeCirclesRef = useRef<Map<string, THREE.Line>>(new Map());
  const projectileMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const laserLinesRef = useRef<THREE.Line[]>([]);
  const flameLinesRef = useRef<THREE.Line[]>([]);
  const iceLinesRef = useRef<THREE.Line[]>([]);
  const electricLinesRef = useRef<THREE.Line[]>([]);
  const enemy3DManagerRef = useRef(getEnemy3DManager());
  const lastFrameTimeRef = useRef(Date.now());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const previewMeshRef = useRef<THREE.Mesh | null>(null);
  const rangeCircleRef = useRef<THREE.Line | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);

  // Инициализация Three.js сцены
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current; // Сохраняем ссылку для cleanup

    // Создаём сцену
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Создаём камеру (как в Warcraft 3 - вид сверху под углом)
    const camera = new THREE.PerspectiveCamera(
      45,
      CANVAS_WIDTH / CANVAS_HEIGHT,
      0.1,
      2000
    );

    // Инициализируем начальную позицию камеры
    const centerX = CANVAS_PADDING + GAME_WIDTH / 2;
    const centerZ = CANVAS_PADDING + GAME_HEIGHT / 2;
    cameraStateRef.current.targetX = centerX;
    cameraStateRef.current.targetZ = centerZ;

    // Устанавливаем камеру с углом 20 градусов (по умолчанию)
    const updateCameraPosition = () => {
      const state = cameraStateRef.current;
      const angleRad = (state.angle * Math.PI) / 180;
      const height = state.distance * Math.sin(angleRad);
      const horizontalDist = state.distance * Math.cos(angleRad);

      camera.position.set(
        state.targetX,
        height,
        state.targetZ + horizontalDist
      );
      camera.lookAt(state.targetX, 0, state.targetZ);
    };

    updateCameraPosition();
    cameraRef.current = camera;

    // Создаём рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Обработчик колесика мыши для зума (как в Warcraft 3)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = cameraStateRef.current;

      // Изменяем целевую дистанцию в зависимости от направления скролла
      const zoomDelta = e.deltaY * 0.5;
      state.targetDistance = Math.max(
        CAMERA_DISTANCE_MIN,
        Math.min(CAMERA_DISTANCE_MAX, state.targetDistance + zoomDelta)
      );

      // Вычисляем целевой угол в зависимости от дистанции
      // distance MIN (близко) -> angle NEAR (30 градусов)
      // distance MAX (далеко) -> angle FAR (85 градусов)
      const t =
        (state.targetDistance - CAMERA_DISTANCE_MIN) /
        (CAMERA_DISTANCE_MAX - CAMERA_DISTANCE_MIN); // 0 to 1
      state.targetAngle =
        CAMERA_ANGLE_NEAR + t * (CAMERA_ANGLE_FAR - CAMERA_ANGLE_NEAR); // от 30 до 85 градусов
    };

    renderer.domElement.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    // Cleanup для wheel listener
    const cleanupWheel = () => {
      renderer.domElement.removeEventListener("wheel", handleWheel);
    };

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 500, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Создаём игровое поле (плоскость) - с учётом PADDING
    const groundGeometry = new THREE.PlaneGeometry(GAME_WIDTH, GAME_HEIGHT);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x16213e,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(centerX, 0, centerZ);
    ground.receiveShadow = true;
    scene.add(ground);
    groundRef.current = ground;

    // Граница игрового поля
    const borderGeometry = new THREE.EdgesGeometry(groundGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x0f3460,
      linewidth: 2,
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.set(centerX, 0.1, centerZ);
    scene.add(border);

    setIsInitialized(true);

    // Cleanup
    return () => {
      cleanupWheel();
      if (
        container &&
        renderer.domElement &&
        container.contains(renderer.domElement)
      ) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Рисуем путь
  useEffect(() => {
    if (!sceneRef.current || !isInitialized || path.length < 2) return;

    const scene = sceneRef.current;

    // Удаляем старый путь
    const oldPaths = scene.children.filter(
      (child) => child.name === "enemyPath"
    );
    oldPaths.forEach((obj) => scene.remove(obj));

    // Рисуем путь как полоски (BoxGeometry для каждого сегмента)
    for (let i = 0; i < path.length - 1; i++) {
      const startX = path[i].x;
      const startY = path[i].y;
      const endX = path[i + 1].x;
      const endY = path[i + 1].y;

      const centerX = (startX + endX) / 2;
      const centerY = (startY + endY) / 2;

      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const width = 40;

      // Создаем тонкий бокс для пути
      const geometry = new THREE.BoxGeometry(
        Math.abs(dx) > 0.1 ? length : width,
        0.5,
        Math.abs(dy) > 0.1 ? length : width
      );

      const material = new THREE.MeshStandardMaterial({
        color: 0x4a90e2,
        roughness: 0.7,
      });

      const pathSegment = new THREE.Mesh(geometry, material);
      pathSegment.position.set(centerX, 0.3, centerY);
      pathSegment.receiveShadow = true;
      pathSegment.name = "enemyPath";
      scene.add(pathSegment);
    }

    // Удаляем старые метки точек поворота
    pathTurnPointsRef.current.forEach((sprite) => {
      scene.remove(sprite);
    });
    pathTurnPointsRef.current.clear();

    // Добавляем метки для точек пути с координатами и углами
    for (let i = 0; i < path.length; i++) {
      const point = path[i];
      const angle = i < path.length - 1 
        ? Math.atan2(path[i + 1].y - point.y, path[i + 1].x - point.x)
        : i > 0
          ? Math.atan2(point.y - path[i - 1].y, point.x - path[i - 1].x)
          : 0;

      // Создаем текстовый спрайт для точки пути
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 60;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`P${i}: (${point.x.toFixed(0)}, ${point.y.toFixed(0)})`, 5, 20);
        if (i < path.length - 1) {
          const angleDeg = (angle * 180 / Math.PI).toFixed(1);
          ctx.fillText(`∠: ${angleDeg}°`, 5, 40);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(80, 24, 1);
      sprite.position.set(point.x, 5, point.y);
      sprite.name = `pathPoint${i}`;
      scene.add(sprite);
      pathTurnPointsRef.current.set(`path-${i}`, sprite);
    }
  }, [path, isInitialized]);

  // Preview башни при наведении
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    const scene = sceneRef.current;

    // Удаляем старый preview
    if (previewMeshRef.current) {
      scene.remove(previewMeshRef.current);
      previewMeshRef.current = null;
    }
    if (rangeCircleRef.current) {
      scene.remove(rangeCircleRef.current);
      rangeCircleRef.current = null;
    }

    // Если нет выбранной башни или позиции мыши - ничего не рисуем
    if (!selectedTowerLevel || !mousePos) return;

    const towerConfig = TOWER_STATS[selectedTowerLevel][0];
    if (!towerConfig) return;

    // Проверяем можно ли поставить башню
    const canPlace = canPlaceTower(
      { x: mousePos.x, y: mousePos.y },
      gameState.towers,
      path,
      towerConfig.size
    );

    // Создаем preview башни
    const geometry = new THREE.CylinderGeometry(
      towerConfig.size / 2,
      towerConfig.size / 2,
      towerConfig.size,
      8
    );
    const material = new THREE.MeshStandardMaterial({
      color: canPlace ? 0x00ff00 : 0xff0000,
      transparent: true,
      opacity: 0.5,
      roughness: 0.6,
    });
    const previewMesh = new THREE.Mesh(geometry, material);
    previewMesh.position.set(mousePos.x, towerConfig.size / 2, mousePos.y);
    scene.add(previewMesh);
    previewMeshRef.current = previewMesh;

    // Создаем круг радиуса атаки
    const segments = 64;
    const circlePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = mousePos.x + Math.cos(angle) * towerConfig.range;
      const z = mousePos.y + Math.sin(angle) * towerConfig.range;
      circlePoints.push(new THREE.Vector3(x, 1, z));
    }

    const circleGeometry = new THREE.BufferGeometry().setFromPoints(
      circlePoints
    );
    const circleMaterial = new THREE.LineBasicMaterial({
      color: canPlace ? 0x00ff00 : 0xff0000,
      transparent: true,
      opacity: 0.6,
    });
    const rangeCircle = new THREE.Line(circleGeometry, circleMaterial);
    scene.add(rangeCircle);
    rangeCircleRef.current = rangeCircle;
  }, [mousePos, selectedTowerLevel, gameState.towers, path, isInitialized]);

  // Анимационный цикл
  useEffect(() => {
    if (!isInitialized) return;

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Вычисляем deltaTime для анимации
      const now = Date.now();
      const deltaTime = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

      // Плавное изменение позиции камеры
      const state = cameraStateRef.current;
      const camera = cameraRef.current;

      if (camera) {
        // Плавная интерполяция дистанции
        state.distance +=
          (state.targetDistance - state.distance) * CAMERA_TRANSITION_SPEED;

        // Плавная интерполяция угла
        state.angle +=
          (state.targetAngle - state.angle) * CAMERA_TRANSITION_SPEED;

        // Обновляем позицию камеры
        const angleRad = (state.angle * Math.PI) / 180;
        const height = state.distance * Math.sin(angleRad);
        const horizontalDist = state.distance * Math.cos(angleRad);

        camera.position.set(
          state.targetX,
          height,
          state.targetZ + horizontalDist
        );
        camera.lookAt(state.targetX, 0, state.targetZ);
      }

      // Обновляем позиции врагов
      if (sceneRef.current) {
        const scene = sceneRef.current;
        const currentEnemyIds = new Set(gameState.enemies.map((e) => e.id));
        const enemy3DManager = enemy3DManagerRef.current;
        const isLoaded = enemy3DManager.isLoaded();

        // Удаляем врагов которых больше нет
        enemyMeshesRef.current.forEach((mesh, id) => {
          if (!currentEnemyIds.has(id)) {
            scene.remove(mesh);
            enemyMeshesRef.current.delete(id);
            enemy3DManager.removeEnemy(id);
            // Удаляем HP sprite
            const hpSprite = enemyHPSpritesRef.current.get(id);
            if (hpSprite) {
              scene.remove(hpSprite);
              enemyHPSpritesRef.current.delete(id);
            }
          }
        });

        // Обновляем или создаём врагов
        gameState.enemies.forEach((enemy) => {
          let mesh = enemyMeshesRef.current.get(enemy.id);

          if (!mesh) {
            // Используем 3D модель напрямую вместо плоскости (не клонируем!)
            const enemy3DModel = enemy3DManager.getOrCreateEnemy(
              enemy.id,
              enemy.modelConfig
            );

            if (enemy3DModel) {
              // Используем модель напрямую, а не клонируем
              mesh = enemy3DModel;
              mesh.position.y = 0; // На уровне земли
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              // Применяем масштаб ОДИН РАЗ при создании модели
              // Объединяем scale из конфигурации модели и scale от размера врага
              const configScale = enemy.modelConfig?.scale || 100;
              const configScaleFactor = configScale / 100; // Например, 20% = 0.2
              const sizeScale = enemy.size / 100; // Например, 20 = 0.2
              const totalScale = configScaleFactor * sizeScale; // Итоговый scale

              // Применяем scale один раз
              mesh.scale.set(totalScale, totalScale, totalScale);

              // Отладочные логи только для первых нескольких врагов
              if (enemyMeshesRef.current.size < 3) {
                const box = new THREE.Box3().setFromObject(mesh);
                const size = box.getSize(new THREE.Vector3());
                console.log(`[Game3DCanvas] ✅ Добавлен враг ${enemy.id} в сцену:`, {
                  position: { x: mesh.position.x.toFixed(2), y: mesh.position.y.toFixed(2), z: mesh.position.z.toFixed(2) },
                  scale: { x: mesh.scale.x.toFixed(3), y: mesh.scale.y.toFixed(3), z: mesh.scale.z.toFixed(3) },
                  totalScale: totalScale.toFixed(3),
                  meshSize: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
                  children: mesh.children.length,
                  visible: mesh.visible
                });
              }

              scene.add(mesh);
              enemyMeshesRef.current.set(enemy.id, mesh);
            } else {
              // Логируем только первые несколько раз
              if (enemyMeshesRef.current.size === 0) {
                console.warn(`[Game3DCanvas] ⚠️ Не удалось получить модель для врага ${enemy.id}`);
              }
            }

            // Создаем HP sprite
            const hpCanvas = document.createElement("canvas");
            hpCanvas.width = 128;
            hpCanvas.height = 32;
            const hpTexture = new THREE.CanvasTexture(hpCanvas);
            const spriteMaterial = new THREE.SpriteMaterial({
              map: hpTexture,
              transparent: true,
            });
            const hpSprite = new THREE.Sprite(spriteMaterial);
            hpSprite.scale.set(enemy.size * 1.2, enemy.size * 0.3, 1);
            scene.add(hpSprite);
            enemyHPSpritesRef.current.set(enemy.id, hpSprite);
          }

          // Обновляем позицию и масштаб только для живых врагов
          if (mesh && !enemy.isDying) {
            mesh.position.set(
              enemy.position.x,
              enemy.z ?? 0, // Используем z из врага, если задан (для дебаггера)
              enemy.position.y
            );

            // Обновляем масштаб модели при изменении размера врага
            if (enemy.modelConfig) {
              const configScale = enemy.modelConfig.scale || 100;
              const configScaleFactor = configScale / 100;
              const sizeScale = enemy.size / 100;
              const totalScale = configScaleFactor * sizeScale;
              mesh.scale.set(totalScale, totalScale, totalScale);
            }

            // Обновляем поворот модели (с поправкой на -90 градусов)
            const rotation = enemy.rotation ?? 0;
            mesh.rotation.y = -rotation - Math.PI / 2; // Поправка на -90 градусов
          }

          // Обновляем HP sprite
          const hpSprite = enemyHPSpritesRef.current.get(enemy.id);
          if (hpSprite && !enemy.isDying) {
            hpSprite.position.set(
              enemy.position.x,
              (enemy.z ?? 0) + enemy.size / 2 + 15, // Учитываем высоту врага
              enemy.position.y
            );

            // Рисуем HP на canvas
            const hpMaterial = hpSprite.material as THREE.SpriteMaterial;
            const hpTexture = hpMaterial.map as THREE.CanvasTexture;
            const hpCanvas = hpTexture.image as HTMLCanvasElement;
            const ctx = hpCanvas.getContext("2d");

            if (ctx) {
              ctx.clearRect(0, 0, hpCanvas.width, hpCanvas.height);

              const barWidth = 100;
              const barHeight = 8;
              const barX = 14;
              const barY = 4;

              // Фон HP
              ctx.fillStyle = "#333";
              ctx.fillRect(barX, barY, barWidth, barHeight);

              // Текущий HP
              const healthPercent = Math.max(
                0,
                Math.min(1, enemy.health / enemy.maxHealth)
              );
              ctx.fillStyle =
                healthPercent > 0.5
                  ? "#0f0"
                  : healthPercent > 0.25
                    ? "#ff0"
                    : "#f00";
              ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

              // Текст HP
              ctx.fillStyle = "#fff";
              ctx.font = "bold 12px Arial";
              ctx.textAlign = "center";
              ctx.fillText(
                `${Math.ceil(enemy.health)}/${enemy.maxHealth}`,
                hpCanvas.width / 2,
                barY + barHeight + 12
              );

              hpTexture.needsUpdate = true;
            }

            hpSprite.visible = true;
          } else if (hpSprite) {
            hpSprite.visible = false;
          }

          // Обрабатываем анимацию смерти
          if (isLoaded && enemy.modelConfig && mesh) {
            if (enemy.isDying && enemy.deathStartTime) {
              const is3DDying = enemy3DManager.isEnemyDying(enemy.id);
              if (!is3DDying) {
                // Сохраняем начальную позицию при начале анимации смерти
                enemy3DManager.startDeathAnimation(
                  enemy.id,
                  enemy.deathStartTime
                );
              }

              // Обновляем анимацию смерти (переворачивание)
              enemy3DManager.updateDeathAnimation(
                enemy.id,
                deltaTime,
                gameState.gameSpeed
              );

              // Применяем отскок к позиции mesh в сцене
              const currentTime = Date.now() / 1000;
              const elapsed = currentTime - enemy.deathStartTime!;
              const deathDuration =
                enemy.modelConfig?.animations.death.duration || 2.0;

              if (elapsed < deathDuration) {
                const knockbackOffset = enemy3DManager.getKnockbackOffset(
                  enemy.id,
                  elapsed,
                  deathDuration
                );
                if (knockbackOffset) {
                  // Применяем отскок к позиции mesh относительно начальной позиции врага
                  // Отскок происходит быстро в начале, затем замедляется
                  mesh.position.x = enemy.position.x + knockbackOffset.x;
                  mesh.position.z = enemy.position.y + knockbackOffset.z; // y в игровых координатах = z в 3D
                  mesh.position.y = enemy.z ?? 0; // Используем z из врага, если задан
                } else {
                  // Если нет knockbackOffset, все равно применяем базовую позицию
                  mesh.position.x = enemy.position.x;
                  mesh.position.z = enemy.position.y;
                  mesh.position.y = enemy.z ?? 0; // Используем z из врага, если задан
                }
              }
            }

            // Обновляем анимацию модели
            enemy3DManager.updateAnimation(
              enemy.id,
              deltaTime,
              gameState.gameSpeed
            );
          }
        });

        // Обновляем башни
        const currentTowerIds = new Set(gameState.towers.map((t) => t.id));

        towerMeshesRef.current.forEach((mesh, id) => {
          if (!currentTowerIds.has(id)) {
            scene.remove(mesh);
            towerMeshesRef.current.delete(id);
            // Удаляем круг радиуса
            const rangeCircle = towerRangeCirclesRef.current.get(id);
            if (rangeCircle) {
              scene.remove(rangeCircle);
              towerRangeCirclesRef.current.delete(id);
            }
            // Удаляем стрелку
            const arrow = towerArrowsRef.current.get(id);
            if (arrow) {
              scene.remove(arrow);
              towerArrowsRef.current.delete(id);
            }
          }
        });

        gameState.towers.forEach((tower) => {
          let mesh = towerMeshesRef.current.get(tower.id);

          if (!mesh) {
            const geometry = new THREE.CylinderGeometry(
              tower.size / 2,
              tower.size / 2,
              tower.size,
              8
            );
            const material = new THREE.MeshStandardMaterial({
              color: 0x888888,
              roughness: 0.6,
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            towerMeshesRef.current.set(tower.id, mesh);

            // Создаем стрелку направления
            const arrowLength = tower.size * 0.6;
            const arrowWidth = tower.size * 0.25;
            const arrowShape = new THREE.Shape();
            arrowShape.moveTo(arrowLength, 0);
            arrowShape.lineTo(0, -arrowWidth);
            arrowShape.lineTo(0, arrowWidth);
            arrowShape.closePath();

            const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
            const arrowMaterial = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.8,
              side: THREE.DoubleSide,
            });
            const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);

            arrowMesh.rotation.x = -Math.PI / 2; // Лежит горизонтально
            scene.add(arrowMesh);
            towerArrowsRef.current.set(tower.id, arrowMesh);

            // Создаем круг радиуса атаки
            const segments = 64;
            const circlePoints: THREE.Vector3[] = [];
            for (let i = 0; i <= segments; i++) {
              const angle = (i / segments) * Math.PI * 2;
              const x = tower.position.x + Math.cos(angle) * tower.range;
              const z = tower.position.y + Math.sin(angle) * tower.range;
              circlePoints.push(new THREE.Vector3(x, 0.5, z));
            }

            const circleGeometry = new THREE.BufferGeometry().setFromPoints(
              circlePoints
            );
            const circleMaterial = new THREE.LineBasicMaterial({
              color: 0x888888,
              transparent: true,
              opacity: 0.3,
            });
            const rangeCircle = new THREE.Line(circleGeometry, circleMaterial);
            scene.add(rangeCircle);
            towerRangeCirclesRef.current.set(tower.id, rangeCircle);
          }

          mesh.position.set(tower.position.x, tower.size / 2, tower.position.y);

          // Подсвечиваем выбранную башню зеленым
          const isSelected = selectedTowerId === tower.id;
          const material = mesh.material as THREE.MeshStandardMaterial;
          if (isSelected) {
            material.color.setHex(0x00ff00); // Зеленый цвет
            material.emissive.setHex(0x004400); // Зеленое свечение
          } else {
            material.color.setHex(0x888888); // Обычный серый цвет
            material.emissive.setHex(0x000000); // Без свечения
          }

          // Обновляем стрелку направления
          const arrowMesh = towerArrowsRef.current.get(tower.id);
          if (arrowMesh) {
            arrowMesh.position.set(
              tower.position.x,
              tower.size + 1,
              tower.position.y
            );
            arrowMesh.rotation.z = -(tower.rotation ?? 0);
          }

          // Обновляем круг радиуса - подсвечиваем зеленым если башня выбрана
          const rangeCircle = towerRangeCirclesRef.current.get(tower.id);
          if (rangeCircle) {
            // Обновляем цвет и прозрачность
            const circleMaterial =
              rangeCircle.material as THREE.LineBasicMaterial;
            if (isSelected) {
              circleMaterial.color.setHex(0x00ff00); // Зеленый цвет
              circleMaterial.opacity = 0.6; // Более яркая прозрачность
            } else {
              circleMaterial.color.setHex(0x888888); // Обычный серый цвет
              circleMaterial.opacity = 0.3; // Обычная прозрачность
            }

            // Обновляем позицию круга радиуса если башня двигалась или радиус изменился
            const segments = 64;
            const circlePoints: THREE.Vector3[] = [];
            for (let i = 0; i <= segments; i++) {
              const angle = (i / segments) * Math.PI * 2;
              const x = tower.position.x + Math.cos(angle) * tower.range;
              const z = tower.position.y + Math.sin(angle) * tower.range;
              circlePoints.push(new THREE.Vector3(x, 0.5, z));
            }
            rangeCircle.geometry.setFromPoints(circlePoints);
          }
        });

        // Обновляем снаряды
        const currentProjectileIds = new Set(
          gameState.projectiles.map((p) => p.id)
        );

        projectileMeshesRef.current.forEach((mesh, id) => {
          if (!currentProjectileIds.has(id)) {
            scene.remove(mesh);
            projectileMeshesRef.current.delete(id);
          }
        });

        gameState.projectiles.forEach((projectile) => {
          let mesh = projectileMeshesRef.current.get(projectile.id);

          if (!mesh) {
            const geometry = new THREE.SphereGeometry(5, 8, 8);
            const material = new THREE.MeshBasicMaterial({
              color: 0xffff00,
              emissive: 0xffff00,
            });
            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            projectileMeshesRef.current.set(projectile.id, mesh);
          }

          mesh.position.set(projectile.position.x, 10, projectile.position.y);
        });

        // Очищаем старые лазерные лучи
        laserLinesRef.current.forEach((line) => scene.remove(line));
        laserLinesRef.current = [];

        // Рисуем лазерные лучи
        gameState.laserBeams?.forEach((laser) => {
          const tower = gameState.towers.find((t) => t.id === laser.towerId);
          const enemy = gameState.enemies.find(
            (e) => e.id === laser.targetEnemyId
          );
          if (tower && enemy) {
            const points = [
              new THREE.Vector3(
                tower.position.x,
                tower.size / 2 + 5,
                tower.position.y
              ),
              new THREE.Vector3(enemy.position.x, 5, enemy.position.y),
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
              color: 0xff0000,
              linewidth: 3,
              transparent: true,
              opacity: 0.8,
            });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            laserLinesRef.current.push(line);
          }
        });

        // Очищаем старые огненные потоки
        flameLinesRef.current.forEach((line) => scene.remove(line));
        flameLinesRef.current = [];

        // Рисуем огненные потоки
        gameState.flameStreams?.forEach((stream) => {
          const tower = gameState.towers.find((t) => t.id === stream.towerId);
          if (tower) {
            // Для огненного оружия может быть несколько целей (конус)
            const targetEnemyIds =
              "targetEnemyIds" in stream
                ? stream.targetEnemyIds
                : "targetEnemyId" in stream
                  ? [stream.targetEnemyId]
                  : [];

            targetEnemyIds.forEach((enemyId) => {
              const enemy = gameState.enemies.find((e) => e.id === enemyId);
              if (enemy) {
                const points = [
                  new THREE.Vector3(
                    tower.position.x,
                    tower.size / 2,
                    tower.position.y
                  ),
                  new THREE.Vector3(enemy.position.x, 5, enemy.position.y),
                ];
                const geometry = new THREE.BufferGeometry().setFromPoints(
                  points
                );
                const material = new THREE.LineBasicMaterial({
                  color: 0xff6600,
                  linewidth: 4,
                  transparent: true,
                  opacity: 0.7,
                });
                const line = new THREE.Line(geometry, material);
                scene.add(line);
                flameLinesRef.current.push(line);
              }
            });
          }
        });

        // Очищаем старые ледяные лучи
        iceLinesRef.current.forEach((line) => scene.remove(line));
        iceLinesRef.current = [];

        // Рисуем ледяные потоки
        gameState.iceStreams?.forEach((stream) => {
          const tower = gameState.towers.find((t) => t.id === stream.towerId);
          if (tower) {
            // Для ледяного оружия может быть несколько целей (конус)
            const targetEnemyIds =
              "targetEnemyIds" in stream
                ? stream.targetEnemyIds
                : "targetEnemyId" in stream
                  ? [stream.targetEnemyId]
                  : [];

            targetEnemyIds.forEach((enemyId) => {
              const enemy = gameState.enemies.find((e) => e.id === enemyId);
              if (enemy) {
                const points = [
                  new THREE.Vector3(
                    tower.position.x,
                    tower.size / 2,
                    tower.position.y
                  ),
                  new THREE.Vector3(enemy.position.x, 5, enemy.position.y),
                ];
                const geometry = new THREE.BufferGeometry().setFromPoints(
                  points
                );
                const material = new THREE.LineBasicMaterial({
                  color: 0x00ffff,
                  linewidth: 3,
                  transparent: true,
                  opacity: 0.8,
                });
                const line = new THREE.Line(geometry, material);
                scene.add(line);
                iceLinesRef.current.push(line);
              }
            });
          }
        });

        // Очищаем старые электрические цепи
        electricLinesRef.current.forEach((line) => scene.remove(line));
        electricLinesRef.current = [];

        // Рисуем электрические цепи
        gameState.electricChains?.forEach((chain) => {
          const tower = gameState.towers.find((t) => t.id === chain.towerId);
          const chainEnemies = chain.targetEnemyIds
            .map((id) => gameState.enemies.find((e) => e.id === id))
            .filter((e): e is Enemy => e !== undefined);

          if (tower && chainEnemies.length > 0) {
            let prevPos = new THREE.Vector3(
              tower.position.x,
              tower.size / 2,
              tower.position.y
            );

            chainEnemies.forEach((enemy) => {
              const points = [
                prevPos.clone(),
                new THREE.Vector3(enemy.position.x, 5, enemy.position.y),
              ];
              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              const material = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                linewidth: 2,
                transparent: true,
                opacity: 0.9,
              });
              const line = new THREE.Line(geometry, material);
              scene.add(line);
              electricLinesRef.current.push(line);

              prevPos = new THREE.Vector3(
                enemy.position.x,
                5,
                enemy.position.y
              );
            });
          }
        });

        // Обновляем превью башни
        if (selectedTowerLevel && mousePos && sceneRef.current) {
          if (!previewMeshRef.current) {
            const geometry = new THREE.CylinderGeometry(20, 20, 40, 8);
            const material = new THREE.MeshStandardMaterial({
              color: 0x00ff00,
              transparent: true,
              opacity: 0.5,
            });
            previewMeshRef.current = new THREE.Mesh(geometry, material);
            scene.add(previewMeshRef.current);
          }
          previewMeshRef.current.visible = true;
          previewMeshRef.current.position.set(mousePos.x, 20, mousePos.y);
        } else if (previewMeshRef.current) {
          previewMeshRef.current.visible = false;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isInitialized, gameState, selectedTowerLevel, mousePos]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Начинаем перетаскивание для панорамирования камеры
    if (e.button === 0) {
      // Left mouse button
      const state = cameraStateRef.current;
      setIsDragging(true);
      state.dragStartX = e.clientX;
      state.dragStartY = e.clientY;
      state.dragStartTargetX = state.targetX;
      state.dragStartTargetZ = state.targetZ;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const wasDragging = isDragging;
    setIsDragging(false);

    // Если мы не перетаскивали (или перетащили совсем чуть-чуть), обрабатываем как клик
    const state = cameraStateRef.current;
    if (
      !wasDragging ||
      (Math.abs(e.clientX - state.dragStartX) < 5 &&
        Math.abs(e.clientY - state.dragStartY) < 5)
    ) {
      handleClick(e);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !groundRef.current)
      return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Конвертируем координаты мыши в normalized device coordinates (-1 to +1)
    mouseRef.current.x = (x / CANVAS_WIDTH) * 2 - 1;
    mouseRef.current.y = -(y / CANVAS_HEIGHT) * 2 + 1;

    // Raycasting для определения точки клика на земле
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(groundRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;

      // Проверяем клик по башне
      for (const tower of gameState.towers) {
        const dx = point.x - tower.position.x;
        const dz = point.z - tower.position.y;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist <= tower.size / 2) {
          onTowerClick(tower.id);
          return;
        }
      }

      // Клик по карте для размещения башни
      onCanvasClick(point.x, point.z);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const state = cameraStateRef.current;

    // Обрабатываем перетаскивание камеры
    if (isDragging && cameraRef.current) {
      const deltaX = e.clientX - state.dragStartX;
      const deltaY = e.clientY - state.dragStartY;

      // Конвертируем движение мыши в движение камеры
      // Учитываем угол камеры для правильного направления панорамирования
      const panSpeed = 1.0;
      const angleRad = (state.angle * Math.PI) / 180;

      state.targetX = state.dragStartTargetX - deltaX * panSpeed;
      state.targetZ =
        state.dragStartTargetZ - deltaY * panSpeed * Math.cos(angleRad);

      // Обновляем позицию камеры
      const height = state.distance * Math.sin(angleRad);
      const horizontalDist = state.distance * Math.cos(angleRad);

      cameraRef.current.position.set(
        state.targetX,
        height,
        state.targetZ + horizontalDist
      );
      cameraRef.current.lookAt(state.targetX, 0, state.targetZ);

      return; // Не обрабатываем preview башни во время перетаскивания
    }

    // Обрабатываем preview башни
    if (
      !selectedTowerLevel ||
      !containerRef.current ||
      !cameraRef.current ||
      !groundRef.current
    ) {
      setMousePos(null);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Конвертируем координаты мыши
    mouseRef.current.x = (x / CANVAS_WIDTH) * 2 - 1;
    mouseRef.current.y = -(y / CANVAS_HEIGHT) * 2 + 1;

    // Raycasting для определения позиции мыши на земле
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(groundRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      setMousePos({ x: point.x, y: point.z });
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        border: "2px solid #0f3460",
        cursor: isDragging
          ? "grabbing"
          : selectedTowerLevel
            ? "crosshair"
            : "grab",
      }}
    />
  );
};
