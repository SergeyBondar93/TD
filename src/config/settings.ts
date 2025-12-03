// Игровые настройки (не для отладки)

export const GAME_SETTINGS = {
  // Визуальные эффекты
  MAX_VISUAL_EFFECTS_PER_SECOND: 30, // Максимум визуальных эффектов в секунду (для производительности)
  
  // Время строительства башни в секундах (базовое для уровня 1)
  BASE_BUILD_TIME: 2,
  
  // Время улучшения башни в секундах (базовое)
  BASE_UPGRADE_TIME: 1.5,

  // Множители для апгрейдов башен
  UPGRADE_COST_MULTIPLIER: 2.5,
  UPGRADE_DAMAGE_MULTIPLIER: 1.8,
  UPGRADE_RANGE_MULTIPLIER: 1.15,
  UPGRADE_FIRE_RATE_MULTIPLIER: 1.2,
  
  // Башни
  TOWER_ROTATION_SPEED: 5, // радиан в секунду
  TOWER_ROTATION_THRESHOLD: 0.1, // ~5.7 градусов - допустимое отклонение для выстрела
  
  // Снаряды
  PROJECTILE_SPEED: 300, // пикселей в секунду
  PROJECTILE_HIT_RADIUS: 15, // радиус попадания снаряда
  
  // Визуализация атак
  LASER_BEAM_DURATION: 100, // мс
  ELECTRIC_CHAIN_DURATION: 150, // мс
  FLAME_STREAM_DURATION: 100, // мс
  ICE_STREAM_DURATION: 100, // мс
  
  // Враги
  ENEMY_DEATH_ANIMATION_DURATION: 3, // секунды (2 сек переворот + 1 сек затухание)
  INFANTRY_PATH_OFFSET_RANGE: 40, // Смещение для пехоты (-20 до +20)
  ELECTRIC_CHAIN_RANGE: 100, // Радиус перескока электрической цепи
};
