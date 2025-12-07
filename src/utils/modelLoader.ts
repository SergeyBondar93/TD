import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer: THREE.AnimationMixer;
}

let soldierModel: LoadedModel | null = null;
let isLoadingSoldier = false;
const soldierLoadCallbacks: ((model: LoadedModel) => void)[] = [];

export async function loadSoldierModel(): Promise<LoadedModel> {
  if (soldierModel) {
    return soldierModel;
  }

  if (isLoadingSoldier) {
    return new Promise((resolve) => {
      soldierLoadCallbacks.push(resolve);
    });
  }

  isLoadingSoldier = true;

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    console.log('[ModelLoader] Начинаю загрузку модели: /models/gltf/Soldier.glb');
    loader.load(
      "/models/gltf/Soldier.glb",
      (gltf) => {
        const scene = gltf.scene;
        const animations: THREE.AnimationClip[] = gltf.animations || [];
        const mixer = new THREE.AnimationMixer(scene);
        
        // Логируем все доступные анимации
        console.log('[ModelLoader] Доступные анимации модели:');
        animations.forEach((anim, index) => {
          console.log(`  [${index}] ${anim.name} (длительность: ${anim.duration.toFixed(2)}с)`);
        });
        
        // Вычисляем размеры модели для отладки
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Подсчитываем меши и материалы
        let meshCount = 0;
        let materialCount = 0;
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshCount++;
            if (child.material) {
              materialCount++;
            }
          }
        });
        
        soldierModel = { scene, animations, mixer };
        isLoadingSoldier = false;
        soldierLoadCallbacks.forEach((cb) => cb(soldierModel!));
        soldierLoadCallbacks.length = 0;
        resolve(soldierModel);
      },
      undefined,
      (error) => {
        console.error('!! Soldier model not loaded', error);
        
        isLoadingSoldier = false;
        reject(error);
      }
    );
  });
}
