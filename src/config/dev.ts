// Константы для разработки и отладки

export const DEV_CONFIG = {
  // Показывать тестовых врагов при загрузке уровня
  TEST_ENEMIES: false,
  // TEST_ENEMIES: true,
  
  // Количество тестовых врагов
  TEST_ENEMIES_COUNT: 5,
  
  // Дистанция между тестовыми врагами
  TEST_ENEMIES_DISTANCE: 15,
  
  // Показывать отладочную информацию на canvas
  SHOW_DEBUG_INFO: true,
  
  // Показывать координаты углов карты
  SHOW_COORDINATES: true,
  
  // Показывать координаты точек пути
  SHOW_PATH_COORDINATES: true,
  
  // Автоматически запускать первый уровень при загрузке (для разработки)
  // AUTO_START_LEVEL: 10,

  GAME_SPEED: .05,
  // GAME_SPEED: 1.05,
  
  // Скрывать цифры HP у пехоты
  HIDE_INFANTRY_HP: true,

  // Скрывать уровень врагов на карте
  SHOW_ENEMY_LEVEL: false,

  // Время строительства башни в секундах (базовое для уровня 1)
  BASE_BUILD_TIME: .2,
  
  // Время улучшения башни в секундах (базовое)
  BASE_UPGRADE_TIME: 1.5,
  
  // Автоматически создавать базовые башни при старте уровня
  AUTO_PLACE_TOWERS: true,

  // Множители для апгрейдов башен
  UPGRADE_COST_MULTIPLIER: 2.5,
  UPGRADE_DAMAGE_MULTIPLIER: 1.8,
  UPGRADE_RANGE_MULTIPLIER: 1.15,
  UPGRADE_FIRE_RATE_MULTIPLIER: 1.2,
};
