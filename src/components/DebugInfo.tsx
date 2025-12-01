import React from 'react';
import type { GameState } from '../types/game';
import { TOWER_STATS } from '../types/game';

interface DebugInfoProps {
  gameState: GameState | null;
  onGameSpeedChange?: (speed: number) => void;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ gameState, onGameSpeedChange }) => {
  if (!gameState) return null;

  // Подсчет статистики
  const totalDamage = gameState.towers.reduce((sum, t) => sum + t.damage, 0);
  const totalTowerCost = gameState.towers.reduce((sum, t) => sum + t.cost, 0);
  const totalEnemyHealth = gameState.enemies.reduce((sum, e) => sum + e.health, 0);
  const totalEnemyMaxHealth = gameState.enemies.reduce((sum, e) => sum + e.maxHealth, 0);
  const totalEnemyReward = gameState.enemies.reduce((sum, e) => sum + e.reward, 0);
  const avgEnemyHealth = gameState.enemies.length > 0 
    ? (totalEnemyHealth / gameState.enemies.length).toFixed(1) 
    : 0;

  // Группировка башен по уровням
  const towersByLevel = gameState.towers.reduce((acc, tower) => {
    acc[tower.level] = (acc[tower.level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Группировка врагов по уровням
  const enemiesByLevel = gameState.enemies.reduce((acc, enemy) => {
    acc[enemy.level] = (acc[enemy.level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div style={styles.container}>
      <h3 style={styles.mainTitle}>🔧 Debug Info</h3>
      
      {/* Контроль скорости игры */}
      {onGameSpeedChange && gameState && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>⚡ Скорость игры</h4>
          <div style={styles.sliderContainer}>
            <input
              type="range"
              min="0.05"
              max="3.0"
              step="0.05"
              value={gameState.gameSpeed}
              onChange={(e) => onGameSpeedChange(parseFloat(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.speedValue}>{gameState.gameSpeed.toFixed(2)}x</div>
          </div>
        </div>
      )}
      
      <div style={styles.columnsContainer}>
        {/* Левая колонка - Общее и Башни */}
        <div style={styles.column}>
          {/* Общая информация */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>📊 Общее</h4>
            <div style={styles.info}>
              <div style={styles.infoRow}>
                <span>Статус:</span>
                <span style={styles.value}>{gameState.gameStatus}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Уровень:</span>
                <span style={styles.value}>{gameState.currentLevel}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Волна:</span>
                <span style={styles.value}>{gameState.currentWave}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Деньги:</span>
                <span style={styles.value}>{gameState.money}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Жизни:</span>
                <span style={styles.value}>{gameState.lives}</span>
              </div>
            </div>
          </div>

          {/* Информация о башнях */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>🗼 Башни ({gameState.towers.length})</h4>
            <div style={styles.info}>
              <div style={styles.infoRow}>
                <span>Всего урона:</span>
                <span style={styles.value}>{totalDamage}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Потрачено:</span>
                <span style={styles.value}>{totalTowerCost}</span>
              </div>
              {gameState.selectedTowerLevel && (
                <div style={styles.infoRow}>
                  <span>Выбрана:</span>
                  <span style={styles.highlight}>Уровень {gameState.selectedTowerLevel}</span>
                </div>
              )}
            </div>
            {Object.keys(towersByLevel).length > 0 && (
              <div style={styles.subsection}>
                <div style={styles.subsectionTitle}>По уровням:</div>
                {Object.entries(towersByLevel).map(([level, count]) => (
                  <div key={level} style={styles.infoRow}>
                    <span>Уровень {level}:</span>
                    <span style={styles.value}>{count}</span>
                  </div>
                ))}
              </div>
            )}
            {gameState.towers.length > 0 && (
              <div style={styles.subsection}>
                <div style={styles.subsectionTitle}>Детали (топ 3):</div>
                {gameState.towers.slice(0, 3).map((tower, idx) => (
                  <div key={tower.id} style={styles.entityCard}>
                    <div style={styles.entityHeader}>#{idx + 1} [L{tower.level}]</div>
                    <div style={styles.entityDetails}>
                      <div>Урон: {tower.damage}</div>
                      <div>Дальн: {tower.range}</div>
                      <div>СкСтр: {tower.fireRate}/s</div>
                      <div>Поз: ({Math.round(tower.position.x)}, {Math.round(tower.position.y)})</div>
                    </div>
                  </div>
                ))}
                {gameState.towers.length > 3 && (
                  <div style={styles.moreInfo}>...и ещё {gameState.towers.length - 3}</div>
                )}
              </div>
            )}
          </div>

          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>👾 Враги ({gameState.enemies.length})</h4>
            <div style={styles.info}>
              <div style={styles.infoRow}>
                <span>Общее HP:</span>
                <span style={styles.value}>{Math.ceil(totalEnemyHealth)}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Макс HP:</span>
                <span style={styles.value}>{totalEnemyMaxHealth}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Средн. HP:</span>
                <span style={styles.value}>{avgEnemyHealth}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Награды:</span>
                <span style={styles.value}>{totalEnemyReward}</span>
              </div>
            </div>
            {Object.keys(enemiesByLevel).length > 0 && (
              <div style={styles.subsection}>
                <div style={styles.subsectionTitle}>По уровням:</div>
                {Object.entries(enemiesByLevel).map(([level, count]) => (
                  <div key={level} style={styles.infoRow}>
                    <span>Уровень {level}:</span>
                    <span style={styles.value}>{count}</span>
                  </div>
                ))}
              </div>
            )}
            {gameState.enemies.length > 0 && (
              <div style={styles.subsection}>
                <div style={styles.subsectionTitle}>Детали (топ 5):</div>
                {gameState.enemies.slice(0, 5).map((enemy, idx) => {
                  const healthPercent = ((enemy.health / enemy.maxHealth) * 100).toFixed(0);
                  return (
                    <div key={enemy.id} style={styles.entityCard}>
                      <div style={styles.entityHeader}>#{idx + 1} [L{enemy.level}]</div>
                      <div style={styles.entityDetails}>
                        <div>HP: {Math.ceil(enemy.health)}/{enemy.maxHealth} ({healthPercent}%)</div>
                        <div>Скор: {enemy.speed}</div>
                        <div>Награда: {enemy.reward}</div>
                        <div>Путь: {enemy.pathIndex}/{gameState.path.length - 1}</div>
                        <div>Поз: ({Math.round(enemy.position.x)}, {Math.round(enemy.position.y)})</div>
                      </div>
                    </div>
                  );
                })}
                {gameState.enemies.length > 5 && (
                  <div style={styles.moreInfo}>...и ещё {gameState.enemies.length - 5}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка - Снаряды и Путь */}
        <div style={styles.column}>
          {/* Информация о снарядах */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>💥 Снаряды ({gameState.projectiles.length})</h4>
            {gameState.projectiles.length > 0 && (
              <div style={styles.subsection}>
                {gameState.projectiles.slice(0, 5).map((proj, idx) => (
                  <div key={proj.id} style={styles.entityCard}>
                    <div style={styles.entityHeader}>Снаряд #{idx + 1}</div>
                    <div style={styles.entityDetails}>
                      <div>Урон: {proj.damage}</div>
                      <div>Скорость: {proj.speed}</div>
                      <div>Цель: {proj.targetEnemyId.slice(0, 8)}...</div>
                      <div>Поз: ({Math.round(proj.position.x)}, {Math.round(proj.position.y)})</div>
                    </div>
                  </div>
                ))}
                {gameState.projectiles.length > 5 && (
                  <div style={styles.moreInfo}>...и ещё {gameState.projectiles.length - 5}</div>
                )}
              </div>
            )}
            {gameState.projectiles.length === 0 && (
              <div style={styles.info}>
                <div style={{color: '#888', fontStyle: 'italic'}}>Нет активных снарядов</div>
              </div>
            )}
          </div>

          {/* Информация о пути */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>🛤️ Путь</h4>
            <div style={styles.info}>
              <div style={styles.infoRow}>
                <span>Точек:</span>
                <span style={styles.value}>{gameState.path.length}</span>
              </div>
            </div>
            <div style={styles.subsection}>
              <div style={styles.subsectionTitle}>Координаты (первые 3):</div>
              {gameState.path.slice(0, 3).map((point, idx) => (
                <div key={idx} style={styles.infoRow}>
                  <span>Точка {idx}:</span>
                  <span style={styles.value}>({point.x}, {point.y})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: '#0f0',
    padding: '10px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '10px',
    maxHeight: 'calc(100vh - 20px)',
    overflowY: 'auto',
    border: '1px solid #0f0',
  },
  columnsContainer: {
    display: 'flex',
    gap: '10px',
  },
  column: {
    flex: 1,
    minWidth: '200px',
  },
  mainTitle: {
    margin: '0 0 8px 0',
    color: '#0ff',
    fontSize: '13px',
    textAlign: 'center',
    borderBottom: '1px solid #0ff',
    paddingBottom: '4px',
  },
  section: {
    marginBottom: '8px',
    padding: '6px',
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderRadius: '4px',
    border: '1px solid rgba(0, 255, 0, 0.3)',
  },
  sectionTitle: {
    margin: '0 0 4px 0',
    color: '#0ff',
    fontSize: '11px',
    borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
    paddingBottom: '2px',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0',
  },
  value: {
    color: '#fff',
    fontWeight: 'bold',
  },
  highlight: {
    color: '#ff0',
    fontWeight: 'bold',
  },
  subsection: {
    marginTop: '4px',
    paddingLeft: '6px',
    borderLeft: '2px solid rgba(0, 255, 0, 0.3)',
  },
  subsectionTitle: {
    color: '#0f0',
    fontSize: '10px',
    marginBottom: '3px',
    fontWeight: 'bold',
  },
  entityCard: {
    marginBottom: '4px',
    padding: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '3px',
    border: '1px solid rgba(0, 255, 0, 0.2)',
  },
  entityHeader: {
    color: '#ff0',
    fontSize: '10px',
    marginBottom: '2px',
    fontWeight: 'bold',
  },
  entityDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    fontSize: '9px',
    color: '#0f0',
  },
  moreInfo: {
    color: '#888',
    fontSize: '10px',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '4px',
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px',
  },
  slider: {
    flex: 1,
    height: '6px',
    cursor: 'pointer',
  },
  speedValue: {
    color: '#ff0',
    fontWeight: 'bold',
    fontSize: '12px',
    minWidth: '50px',
    textAlign: 'right',
  },
};
