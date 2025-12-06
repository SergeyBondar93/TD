import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer: THREE.AnimationMixer;
}

let spiderModel: LoadedModel | null = null;
let spiderModel_Collada: LoadedModel | null = null;
let isLoadingSpider = false;
let isLoadingSpider_Collada = false;
const spiderLoadCallbacks: ((model: LoadedModel) => void)[] = [];
const spiderLoadCallbacks_Collada: ((model: LoadedModel) => void)[] = [];
export async function loadSpiderModel_MTL(): Promise<LoadedModel> {
  // Если модель уже загружена, возвращаем её
  if (spiderModel) {
    return spiderModel;
  }

  // Если идёт загрузка, ждём её завершения
  if (isLoadingSpider) {
    return new Promise((resolve) => {
      spiderLoadCallbacks.push(resolve);
    });
  }

  isLoadingSpider = true;

  return new Promise((resolve, reject) => {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath("/models/spider/obj/");

    mtlLoader.load(
      "Only_Spider_with_Animations_Export.mtl",
      (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath("/models/spider/obj/");

        objLoader.load(
          "Only_Spider_with_Animations_Export.obj",
          (object) => {

            // OBJ не имеет анимаций, создаём пустой массив
            const scene = object as THREE.Group;
            const animations: THREE.AnimationClip[] = [];
            const mixer = new THREE.AnimationMixer(scene);

            spiderModel = { scene, animations, mixer };
            isLoadingSpider = false;

            // Вызываем все колбэки, ожидающие загрузки
            spiderLoadCallbacks.forEach((cb) => cb(spiderModel!));
            spiderLoadCallbacks.length = 0;

            resolve(spiderModel);
          },
          (progress) => {
            // Loading progress
          },
          (error) => {
            isLoadingSpider = false;
            reject(error);
          }
        );
      },
      undefined,
      (error) => {
        isLoadingSpider = false;
        reject(error);
      }
    );
  });
}

export async function loadSpiderModel_Collada(): Promise<LoadedModel> {
  if (spiderModel_Collada) {
    return spiderModel_Collada;
  }

  if (isLoadingSpider_Collada) {
    return new Promise((resolve) => {
      spiderLoadCallbacks_Collada.push(resolve);
    });
  }

  isLoadingSpider_Collada = true;

  return new Promise((resolve, reject) => {
    const loader = new ColladaLoader();
    loader.setPath("/models/spider/dae/");
    loader.load(
      "spider.dae",
      (object) => {
        const scene = object.scene as unknown as THREE.Group;
        const animations: THREE.AnimationClip[] = [];
        const mixer = new THREE.AnimationMixer(scene);
        spiderModel_Collada = { scene, animations, mixer };
        isLoadingSpider_Collada = false;
        spiderLoadCallbacks_Collada.forEach((cb) => cb(spiderModel_Collada!));
        spiderLoadCallbacks_Collada.length = 0;
        resolve(spiderModel_Collada!);
      },
      (progress) => {
        // Loading progress
      },
      (error) => {
        isLoadingSpider_Collada = false;
        reject(error);
      }
    );
  });
}
