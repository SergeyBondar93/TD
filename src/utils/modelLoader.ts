import * as THREE from "three";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer: THREE.AnimationMixer;
}

let spiderModel: LoadedModel | null = null;
let isLoadingSpider = false;
const spiderLoadCallbacks: ((model: LoadedModel) => void)[] = [];

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
