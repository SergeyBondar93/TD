import * as THREE from "three";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer: THREE.AnimationMixer;
}

let spiderModel: LoadedModel | null = null;
let isLoadingSpider = false;
const spiderLoadCallbacks: ((model: LoadedModel) => void)[] = [];

let spiderModelFBX: LoadedModel | null = null;
let isLoadingSpiderFBX = false;
const spiderFBXLoadCallbacks: ((model: LoadedModel) => void)[] = [];

let spiderModelOBJ: LoadedModel | null = null;
let isLoadingSpiderOBJ = false;
const spiderOBJLoadCallbacks: ((model: LoadedModel) => void)[] = [];

export async function loadSpiderModel_Collada(): Promise<LoadedModel> {
  if (spiderModel) {
    return spiderModel;
  }

  if (isLoadingSpider) {
    return new Promise((resolve) => {
      spiderLoadCallbacks.push(resolve);
    });
  }

  isLoadingSpider = true;

  return new Promise((resolve, reject) => {
    const loader = new ColladaLoader();
    loader.setPath("/models/spider/dae/");
    loader.load(
      "spider.dae",
      (object) => {
        const scene = object.scene as unknown as THREE.Group;
        const animations: THREE.AnimationClip[] = [];
        const mixer = new THREE.AnimationMixer(scene);
        spiderModel = { scene, animations, mixer };
        isLoadingSpider = false;
        spiderLoadCallbacks.forEach((cb) => cb(spiderModel!));
        spiderLoadCallbacks.length = 0;
        resolve(spiderModel);
      },
      undefined,
      (error) => {
        isLoadingSpider = false;
        reject(error);
      }
    );
  });
}

export async function loadSpiderModel_FBX(): Promise<LoadedModel> {
  if (spiderModelFBX) {
    return spiderModelFBX;
  }

  if (isLoadingSpiderFBX) {
    return new Promise((resolve) => {
      spiderFBXLoadCallbacks.push(resolve);
    });
  }

  isLoadingSpiderFBX = true;

  return new Promise((resolve, reject) => {
    const loader = new FBXLoader();
    loader.setPath("/models/spider/fbx/");
    loader.load(
      "Spider.fbx",
      (object) => {
        const scene = object as THREE.Group;
        const animations: THREE.AnimationClip[] = object.animations || [];
        const mixer = new THREE.AnimationMixer(scene);
        spiderModelFBX = { scene, animations, mixer };
        isLoadingSpiderFBX = false;
        spiderFBXLoadCallbacks.forEach((cb) => cb(spiderModelFBX!));
        spiderFBXLoadCallbacks.length = 0;
        resolve(spiderModelFBX);
      },
      undefined,
      (error) => {
        isLoadingSpiderFBX = false;
        reject(error);
      }
    );
  });
}

export async function loadSpiderModel_OBJ(): Promise<LoadedModel> {
  if (spiderModelOBJ) {
    return spiderModelOBJ;
  }

  if (isLoadingSpiderOBJ) {
    return new Promise((resolve) => {
      spiderOBJLoadCallbacks.push(resolve);
    });
  }

  isLoadingSpiderOBJ = true;

  return new Promise((resolve, reject) => {
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();
    const path = "/models/spider/obj/";

    // Сначала загружаем материалы
    mtlLoader.setPath(path);
    mtlLoader.load(
      "Only_Spider_with_Animations_Export.mtl",
      (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.setPath(path);

        // Затем загружаем модель
        objLoader.load(
          "Only_Spider_with_Animations_Export.obj",
          (object) => {
            const scene = object as THREE.Group;
            const animations: THREE.AnimationClip[] = [];
            const mixer = new THREE.AnimationMixer(scene);
            spiderModelOBJ = { scene, animations, mixer };
            isLoadingSpiderOBJ = false;
            spiderOBJLoadCallbacks.forEach((cb) => cb(spiderModelOBJ!));
            spiderOBJLoadCallbacks.length = 0;
            resolve(spiderModelOBJ);
          },
          undefined,
          (error) => {
            isLoadingSpiderOBJ = false;
            reject(error);
          }
        );
      },
      undefined,
      (error) => {
        isLoadingSpiderOBJ = false;
        reject(error);
      }
    );
  });
}
