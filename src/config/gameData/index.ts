// Экспорт всех игровых ресурсов из одного места
export {
  ENEMY_CLASSES_BY_LEVEL,
  type EnemyClass,
  type EnemyModelConfig,
  type EnemyAnimation,
} from "./enemies";
export { LEVELS, DEFAULT_PATH } from "./levels";
export type { LevelConfig } from "../../types/game";
export { TOWER_STATS, createTowerFromStats, type TowerStats } from "./towers";
