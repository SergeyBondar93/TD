import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer: THREE.AnimationMixer;
}

let wolfModel: LoadedModel | null = null;
let spiderModel: LoadedModel | null = null;
let isLoading = false;
let isLoadingSpider = false;
const loadCallbacks: ((model: LoadedModel) => void)[] = [];
const spiderLoadCallbacks: ((model: LoadedModel) => void)[] = [];

export async function loadWolfModel(): Promise<LoadedModel> {
  console.log('[ModelLoader] loadWolfModel called, isLoading:', isLoading, 'wolfModel:', wolfModel);
  
  // Если модель уже загружена, возвращаем её
  if (wolfModel) {
    console.log('[ModelLoader] Returning cached model');
    return wolfModel;
  }

  // Если идёт загрузка, ждём её завершения
  if (isLoading) {
    console.log('[ModelLoader] Already loading, waiting...');
    return new Promise((resolve) => {
      loadCallbacks.push(resolve);
    });
  }

  isLoading = true;
  console.log('[ModelLoader] Starting to load model from /models/wolf/gltf/Wolf-Blender-2.82a.glb');

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      '/models/wolf/gltf/Wolf-Blender-2.82a.glb',
      (gltf) => {
        console.log('[ModelLoader] Model loaded successfully!', gltf);
        const scene = gltf.scene;
        const animations = gltf.animations;
        const mixer = new THREE.AnimationMixer(scene);

        // Запускаем анимацию ходьбы/бега, если она есть
        if (animations && animations.length > 0) {
          console.log('[ModelLoader] Found animations:', animations.length);
          // Обычно первая анимация - это базовая анимация движения
          const action = mixer.clipAction(animations[0]);
          action.play();
        } else {
          console.log('[ModelLoader] No animations found');
        }

        wolfModel = { scene, animations, mixer };
        isLoading = false;

        // Вызываем все колбэки, ожидающие загрузки
        loadCallbacks.forEach(cb => cb(wolfModel!));
        loadCallbacks.length = 0;

        console.log('[ModelLoader] Model ready to use');
        resolve(wolfModel);
      },
      (progress) => {
        console.log('[ModelLoader] Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        isLoading = false;
        console.error('[ModelLoader] Error loading wolf model:', error);
        reject(error);
      }
    );
  });
}

export async function loadSpiderModel(): Promise<LoadedModel> {
  console.log('[ModelLoader] loadSpiderModel called, isLoadingSpider:', isLoadingSpider, 'spiderModel:', spiderModel);
  
  // Если модель уже загружена, возвращаем её
  if (spiderModel) {
    console.log('[ModelLoader] Returning cached spider model');
    return spiderModel;
  }

  // Если идёт загрузка, ждём её завершения
  if (isLoadingSpider) {
    console.log('[ModelLoader] Already loading spider, waiting...');
    return new Promise((resolve) => {
      spiderLoadCallbacks.push(resolve);
    });
  }

  isLoadingSpider = true;
  console.log('[ModelLoader] Starting to load spider model from /models/spider/');

  return new Promise((resolve, reject) => {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('/models/spider/obj/');
    
    mtlLoader.load(
      'Only_Spider_with_Animations_Export.mtl',
      (materials) => {
        materials.preload();
        console.log('[ModelLoader] MTL materials loaded');
        
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('/models/spider/obj/');
        
        objLoader.load(
          'Only_Spider_with_Animations_Export.obj',
          (object) => {
            console.log('[ModelLoader] Spider OBJ loaded successfully!', object);
            console.log('[ModelLoader] Spider children count:', object.children.length);
            
            // Диагностика структуры модели - ищем ноги
            object.traverse((child) => {
              console.log('[ModelLoader] Child:', child.type, child.name, child);
              if (child instanceof THREE.Mesh) {
                console.log('[ModelLoader] Mesh:', child.name, 'Geometry:', child.geometry);
              }
            });
            
            // OBJ не имеет анимаций, создаём пустой массив
            const scene = object as THREE.Group;
            const animations: THREE.AnimationClip[] = [];
            const mixer = new THREE.AnimationMixer(scene);

            spiderModel = { scene, animations, mixer };
            isLoadingSpider = false;

            // Вызываем все колбэки, ожидающие загрузки
            spiderLoadCallbacks.forEach(cb => cb(spiderModel!));
            spiderLoadCallbacks.length = 0;

            console.log('[ModelLoader] Spider model ready to use');
            resolve(spiderModel);
          },
          (progress) => {
            console.log('[ModelLoader] Loading spider progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
          },
          (error) => {
            isLoadingSpider = false;
            console.error('[ModelLoader] Error loading spider model:', error);
            reject(error);
          }
        );
      },
      undefined,
      (error) => {
        isLoadingSpider = false;
        console.error('[ModelLoader] Error loading spider MTL:', error);
        reject(error);
      }
    );
  });
}
