import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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

interface Game3DCanvasProps {
  gameState: GameState;
  onCanvasClick: (x: number, y: number) => void;
  onTowerClick: (towerId: string) => void;
  selectedTowerLevel: 1 | 2 | 3 | 4 | 5 | null;
  path: { x: number; y: number }[];
}

export const Game3DCanvas: React.FC<Game3DCanvasProps> = ({
  gameState,
  onCanvasClick,
  onTowerClick,
  selectedTowerLevel,
  path,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Храним 3D объекты врагов
  const enemyMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const enemyHPSpritesRef = useRef<Map<string, THREE.Sprite>>(new Map());
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
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
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
    // Позиция камеры - смотрим на центр игрового поля (с учётом PADDING)
    const centerX = CANVAS_PADDING + GAME_WIDTH / 2;
    const centerZ = CANVAS_PADDING + GAME_HEIGHT / 2;
    camera.position.set(centerX, 400, centerZ + 400);
    camera.lookAt(centerX, 0, centerZ);
    cameraRef.current = camera;

    // Создаём рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    console.log('!!!', renderer.domElement)
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Добавляем OrbitControls для управления камерой (скролл для зума)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 300;
    controls.maxDistance = 1000;
    controls.maxPolarAngle = Math.PI / 2.5; // Ограничиваем угол
    controls.target.set(centerX, 0, centerZ);
    controlsRef.current = controls;

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
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x0f3460, linewidth: 2 });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.set(centerX, 0.1, centerZ);
    scene.add(border);

    setIsInitialized(true);

    // Cleanup
    return () => {
      console.log('!!CLEAN START')
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        console.log('!!CLEAN END')
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Рисуем путь
  useEffect(() => {
    if (!sceneRef.current || !isInitialized || path.length < 2) return;

    const scene = sceneRef.current;

    // Удаляем старый путь
    const oldPaths = scene.children.filter(child => child.name === "enemyPath");
    oldPaths.forEach(obj => scene.remove(obj));

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
    
    const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
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

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Вычисляем deltaTime для анимации
      const now = Date.now();
      const deltaTime = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

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
            // Создаём плоскость для отображения 3D модели паука
            const planeGeometry = new THREE.PlaneGeometry(enemy.size, enemy.size);
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            const material = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              side: THREE.DoubleSide,
            });
            mesh = new THREE.Mesh(planeGeometry, material);
            mesh.rotation.x = -Math.PI / 2; // Поворачиваем чтобы лежала горизонтально
            mesh.position.y = 1; // Немного приподнимаем над землёй
            scene.add(mesh);
            enemyMeshesRef.current.set(enemy.id, mesh);
            
            // Создаем HP sprite
            const hpCanvas = document.createElement('canvas');
            hpCanvas.width = 128;
            hpCanvas.height = 32;
            const hpTexture = new THREE.CanvasTexture(hpCanvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: hpTexture, transparent: true });
            const hpSprite = new THREE.Sprite(spriteMaterial);
            hpSprite.scale.set(enemy.size * 1.2, enemy.size * 0.3, 1);
            scene.add(hpSprite);
            enemyHPSpritesRef.current.set(enemy.id, hpSprite);
          }

          // Обновляем позицию
          mesh.position.set(
            enemy.position.x,
            1,
            enemy.position.y
          );
          
          // Обновляем HP sprite
          const hpSprite = enemyHPSpritesRef.current.get(enemy.id);
          if (hpSprite && !enemy.isDying) {
            hpSprite.position.set(
              enemy.position.x,
              enemy.size / 2 + 15,
              enemy.position.y
            );
            
            // Рисуем HP на canvas
            const hpMaterial = hpSprite.material as THREE.SpriteMaterial;
            const hpTexture = hpMaterial.map as THREE.CanvasTexture;
            const hpCanvas = hpTexture.image as HTMLCanvasElement;
            const ctx = hpCanvas.getContext('2d');
            
            if (ctx) {
              ctx.clearRect(0, 0, hpCanvas.width, hpCanvas.height);
              
              const barWidth = 100;
              const barHeight = 8;
              const barX = 14;
              const barY = 4;
              
              // Фон HP
              ctx.fillStyle = '#333';
              ctx.fillRect(barX, barY, barWidth, barHeight);
              
              // Текущий HP
              const healthPercent = Math.max(0, Math.min(1, enemy.health / enemy.maxHealth));
              ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
              ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
              
              // Текст HP
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 12px Arial';
              ctx.textAlign = 'center';
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

          // Рендерим 3D модель паука и обновляем текстуру
          if (isLoaded && enemy.modelConfig) {
            enemy3DManager.getOrCreateEnemy(enemy.id, enemy.modelConfig);

            if (enemy.isDying && enemy.deathStartTime) {
              const is3DDying = enemy3DManager.isEnemyDying(enemy.id);
              if (!is3DDying) {
                enemy3DManager.startDeathAnimation(enemy.id, enemy.deathStartTime);
              }
            }

            const rotation = enemy.rotation ?? 0;
            const modelCanvas = enemy3DManager.render(
              enemy.id,
              rotation,
              deltaTime,
              gameState.gameSpeed
            );

            if (modelCanvas && mesh.material instanceof THREE.MeshBasicMaterial) {
              const texture = mesh.material.map as THREE.CanvasTexture;
              const ctx = texture.image.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, 128, 128);
                ctx.drawImage(modelCanvas, 0, 0, 128, 128);
                texture.needsUpdate = true;
              }
            }
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
            
            const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
            const circleMaterial = new THREE.LineBasicMaterial({
              color: 0x888888,
              transparent: true,
              opacity: 0.3,
            });
            const rangeCircle = new THREE.Line(circleGeometry, circleMaterial);
            scene.add(rangeCircle);
            towerRangeCirclesRef.current.set(tower.id, rangeCircle);
          }

          mesh.position.set(
            tower.position.x,
            tower.size / 2,
            tower.position.y
          );
          
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
          
          // Обновляем позицию круга радиуса если башня двигалась или радиус изменился
          const rangeCircle = towerRangeCirclesRef.current.get(tower.id);
          if (rangeCircle) {
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
        const currentProjectileIds = new Set(gameState.projectiles.map((p) => p.id));

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

          mesh.position.set(
            projectile.position.x,
            10,
            projectile.position.y
          );
        });

        // Очищаем старые лазерные лучи
        laserLinesRef.current.forEach(line => scene.remove(line));
        laserLinesRef.current = [];

        // Рисуем лазерные лучи
        gameState.laserBeams?.forEach((laser) => {
          const tower = gameState.towers.find((t) => t.id === laser.towerId);
          const enemy = gameState.enemies.find((e) => e.id === laser.targetEnemyId);
          if (tower && enemy) {
            const points = [
              new THREE.Vector3(tower.position.x, tower.size / 2 + 5, tower.position.y),
              new THREE.Vector3(enemy.position.x, 5, enemy.position.y)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
              color: 0xff0000,
              linewidth: 3,
              transparent: true,
              opacity: 0.8
            });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            laserLinesRef.current.push(line);
          }
        });

        // Очищаем старые огненные потоки
        flameLinesRef.current.forEach(line => scene.remove(line));
        flameLinesRef.current = [];

        // Рисуем огненные потоки
        gameState.flameStreams?.forEach((stream) => {
          const tower = gameState.towers.find((t) => t.id === stream.towerId);
          const enemy = gameState.enemies.find((e) => e.id === stream.targetEnemyId);
          if (tower && enemy) {
            const points = [
              new THREE.Vector3(tower.position.x, tower.size / 2, tower.position.y),
              new THREE.Vector3(enemy.position.x, 5, enemy.position.y)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
              color: 0xff6600,
              linewidth: 4,
              transparent: true,
              opacity: 0.7
            });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            flameLinesRef.current.push(line);
          }
        });

        // Очищаем старые ледяные лучи
        iceLinesRef.current.forEach(line => scene.remove(line));
        iceLinesRef.current = [];

        // Рисуем ледяные потоки
        gameState.iceStreams?.forEach((stream) => {
          const tower = gameState.towers.find((t) => t.id === stream.towerId);
          const enemy = gameState.enemies.find((e) => e.id === stream.targetEnemyId);
          if (tower && enemy) {
            const points = [
              new THREE.Vector3(tower.position.x, tower.size / 2, tower.position.y),
              new THREE.Vector3(enemy.position.x, 5, enemy.position.y)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
              color: 0x00ffff,
              linewidth: 3,
              transparent: true,
              opacity: 0.8
            });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            iceLinesRef.current.push(line);
          }
        });

        // Очищаем старые электрические цепи
        electricLinesRef.current.forEach(line => scene.remove(line));
        electricLinesRef.current = [];

        // Рисуем электрические цепи
        gameState.electricChains?.forEach((chain) => {
          const tower = gameState.towers.find((t) => t.id === chain.towerId);
          const chainEnemies = chain.targetEnemyIds
            .map((id) => gameState.enemies.find((e) => e.id === id))
            .filter((e): e is Enemy => e !== undefined);

          if (tower && chainEnemies.length > 0) {
            let prevPos = new THREE.Vector3(tower.position.x, tower.size / 2, tower.position.y);
            
            chainEnemies.forEach((enemy) => {
              const points = [
                prevPos.clone(),
                new THREE.Vector3(enemy.position.x, 5, enemy.position.y)
              ];
              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              const material = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                linewidth: 2,
                transparent: true,
                opacity: 0.9
              });
              const line = new THREE.Line(geometry, material);
              scene.add(line);
              electricLinesRef.current.push(line);
              
              prevPos = new THREE.Vector3(enemy.position.x, 5, enemy.position.y);
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

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !groundRef.current) return;

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
    if (!selectedTowerLevel || !containerRef.current || !cameraRef.current || !groundRef.current) {
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
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        border: "2px solid #0f3460",
        cursor: selectedTowerLevel ? "crosshair" : "default",
      }}
    />
  );
};
