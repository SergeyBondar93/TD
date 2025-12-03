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
    <div className="debug-info-container" style={styles.container}>
      <h3 className="debug-info-title" style={styles.mainTitle}>🔧 Debug Info</h3>
      
      {/* Контроль скорости игры */}
      {onGameSpeedChange && gameState && (
        <div className="debug-info-section debug-info-game-speed" style={styles.section}>
          <h4 className="debug-info-section-title" style={styles.sectionTitle}>⚡ Скорость игры</h4>
          <div className="debug-info-slider-container" style={styles.sliderContainer}>
            <input
              type="range"
              className="debug-info-slider"
              min="0"
              max="16.0"
              step="0.05"
              value={gameState.gameSpeed}
              onChange={(e) => onGameSpeedChange(parseFloat(e.target.value))}
              style={styles.slider}
            />
            <div className="debug-info-speed-value" style={styles.speedValue}>{gameState.gameSpeed.toFixed(2)}x</div>
          </div>
        </div>
      )}
      
      <div className="debug-info-columns" style={styles.columnsContainer}>
        {/* Левая колонка - Общее и Башни */}
        <div className="debug-info-column debug-info-left-column" style={styles.column}>
          {/* Общая информация */}
          <div className="debug-info-section debug-info-general" style={styles.section}>
            <h4 className="debug-info-section-title" style={styles.sectionTitle}>📊 Общее</h4>
            <div className="debug-info-content" style={styles.info}>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Статус:</span>
                <span className="debug-info-value" style={styles.value}>{gameState.gameStatus}</span>
              </div>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Уровень:</span>
                <span className="debug-info-value" style={styles.value}>{gameState.currentLevel}</span>
              </div>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Волна:</span>
                <span className="debug-info-value" style={styles.value}>{gameState.currentWave}</span>
              </div>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Деньги:</span>
                <span className="debug-info-value" style={styles.value}>{gameState.money}</span>
              </div>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Жизни:</span>
                <span className="debug-info-value" style={styles.value}>{gameState.lives}</span>
              </div>
            </div>
          </div>

          {/* Информация о башнях */}
          <div className="debug-info-section debug-info-towers" style={styles.section}>
            <h4 className="debug-info-section-title" style={styles.sectionTitle}>🗼 Башни ({gameState.towers.length})</h4>
            <div className="debug-info-content" style={styles.info}>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Всего урона:</span>
                <span className="debug-info-value" style={styles.value}>{totalDamage}</span>
              </div>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Потрачено:</span>
                <span className="debug-info-value" style={styles.value}>{totalTowerCost}</span>
              </div>
              {gameState.selectedTowerLevel && (
                <div className="debug-info-row" style={styles.infoRow}>
                  <span>Выбрана:</span>
                  <span className="debug-info-highlight" style={styles.highlight}>Уровень {gameState.selectedTowerLevel}</span>
                </div>
              )}
            </div>
            {Object.keys(towersByLevel).length > 0 && (
              <div className="debug-info-subsection" style={styles.subsection}>
                <div className="debug-info-subsection-title" style={styles.subsectionTitle}>По уровням:</div>
                {Object.entries(towersByLevel).map(([level, count]) => (
                  <div key={level} className="debug-info-row" style={styles.infoRow}>
                    <span>Уровень {level}:</span>
                    <span className="debug-info-value" style={styles.value}>{count}</span>
                  </div>
                ))}
              </div>
            )}
            {gameState.towers.length > 0 && (
              <div className="debug-info-subsection" style={styles.subsection}>
                <div className="debug-info-subsection-title" style={styles.subsectionTitle}>Детали (топ 3):</div>
                {gameState.towers.slice(0, 3).map((tower, idx) => (
                  <div key={tower.id} className="debug-info-entity-card debug-info-tower-card" style={styles.entityCard}>
                    <div className="debug-info-entity-header" style={styles.entityHeader}>#{idx + 1} [L{tower.level}]</div>
                    <div className="debug-info-entity-details" style={styles.entityDetails}>
                      <div>Урон: {tower.damage}</div>
                      <div>Дальн: {tower.range}</div>
                      <div>СкСтр: {tower.fireRate}/s</div>
                      <div>Поз: ({Math.round(tower.position.x)}, {Math.round(tower.position.y)})</div>
                    </div>
                  </div>
                ))}
                {gameState.towers.length > 3 && (
                  <div className="debug-info-more" style={styles.moreInfo}>...и ещё {gameState.towers.length - 3}</div>
                )}
              </div>
            )}
          </div>

          <div className="debug-info-section debug-info-enemies" style={styles.section}>
            <h4 className="debug-info-section-title" style={styles.sectionTitle}>👾 Враги ({gameState.enemies.length})</h4>
            <div className="debug-info-content" style={styles.info}>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Общее HP:</span>
                <span className="debug-info-value" style={styles.value}>{Math.ceil(totalEnemyHealth)}</span>
              </div>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Макс HP:</span>
                <span className="debug-info-value" style={styles.value}>{totalEnemyMaxHealth}</span>
              </div>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Средн. HP:</span>
                <span className="debug-info-value" style={styles.value}>{avgEnemyHealth}</span>
              </div>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Награды:</span>
                <span className="debug-info-value" style={styles.value}>{totalEnemyReward}</span>
              </div>
            </div>
            {Object.keys(enemiesByLevel).length > 0 && (
              <div className="debug-info-subsection" style={styles.subsection}>
                <div className="debug-info-subsection-title" style={styles.subsectionTitle}>По уровням:</div>
                {Object.entries(enemiesByLevel).map(([level, count]) => (
                  <div key={level} className="debug-info-row" style={styles.infoRow}>
                    <span>Уровень {level}:</span>
                    <span className="debug-info-value" style={styles.value}>{count}</span>
                  </div>
                ))}
              </div>
            )}
            {gameState.enemies.length > 0 && (
              <div className="debug-info-subsection" style={styles.subsection}>
                <div className="debug-info-subsection-title" style={styles.subsectionTitle}>Детали (топ 5):</div>
                {gameState.enemies.slice(0, 5).map((enemy, idx) => {
                  const healthPercent = ((enemy.health / enemy.maxHealth) * 100).toFixed(0);
                  const turnCount = enemy.turnPoints?.length || 0;
                  return (
                    <div key={enemy.id} className="debug-info-entity-card debug-info-enemy-card" style={styles.entityCard}>
                      <div className="debug-info-entity-header" style={styles.entityHeader}>#{idx + 1} [L{enemy.level}]</div>
                      <div className="debug-info-entity-details" style={styles.entityDetails}>
                        <div>HP: {Math.ceil(enemy.health)}/{enemy.maxHealth} ({healthPercent}%)</div>
                        <div>Скор: {enemy.speed}</div>
                        <div>Награда: {enemy.reward}</div>
                        <div>Путь: {enemy.pathIndex}/{gameState.path.length - 1}</div>
                        <div>Поз: ({Math.round(enemy.position.x)}, {Math.round(enemy.position.y)})</div>
                        <div style={{color: '#ff0'}}>Поворотов: {turnCount}</div>
                        {enemy.turnPoints && enemy.turnPoints.length > 0 && (
                          <div style={{fontSize: '8px', color: '#888', marginTop: '2px'}}>
                            {enemy.turnPoints.map((tp, tpIdx) => (
                              <div key={tpIdx}>#{tpIdx + 1}: ({Math.round(tp.x)}, {Math.round(tp.y)})</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {gameState.enemies.length > 5 && (
                  <div className="debug-info-more" style={styles.moreInfo}>...и ещё {gameState.enemies.length - 5}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка - Снаряды и Путь */}
        <div className="debug-info-column debug-info-right-column" style={styles.column}>
          {/* Информация о снарядах */}
          <div className="debug-info-section debug-info-projectiles" style={styles.section}>
            <h4 className="debug-info-section-title" style={styles.sectionTitle}>💥 Снаряды ({gameState.projectiles.length})</h4>
            {gameState.projectiles.length > 0 && (
              <div className="debug-info-subsection" style={styles.subsection}>
                {gameState.projectiles.slice(0, 5).map((proj, idx) => (
                  <div key={proj.id} className="debug-info-entity-card debug-info-projectile-card" style={styles.entityCard}>
                    <div className="debug-info-entity-header" style={styles.entityHeader}>Снаряд #{idx + 1}</div>
                    <div className="debug-info-entity-details" style={styles.entityDetails}>
                      <div>Урон: {proj.damage}</div>
                      <div>Скорость: {proj.speed}</div>
                      <div>Цель: {proj.targetEnemyId.slice(0, 8)}...</div>
                      <div>Поз: ({Math.round(proj.position.x)}, {Math.round(proj.position.y)})</div>
                    </div>
                  </div>
                ))}
                {gameState.projectiles.length > 5 && (
                  <div className="debug-info-more" style={styles.moreInfo}>...и ещё {gameState.projectiles.length - 5}</div>
                )}
              </div>
            )}
            {gameState.projectiles.length === 0 && (
              <div className="debug-info-content" style={styles.info}>
                <div className="debug-info-empty" style={{color: '#888', fontStyle: 'italic'}}>Нет активных снарядов</div>
              </div>
            )}
          </div>

          {/* Информация о пути */}
          <div className="debug-info-section debug-info-path" style={styles.section}>
            <h4 className="debug-info-section-title" style={styles.sectionTitle}>🛤️ Путь</h4>
            <div className="debug-info-content" style={styles.info}>
              <div className="debug-info-row" style={styles.infoRow}>
                <span>Точек:</span>
                <span className="debug-info-value" style={styles.value}>{gameState.path.length}</span>
              </div>
            </div>
            <div className="debug-info-subsection" style={styles.subsection}>
              <div className="debug-info-subsection-title" style={styles.subsectionTitle}>Координаты (первые 3):</div>
              {gameState.path.slice(0, 3).map((point, idx) => (
                <div key={idx} className="debug-info-row" style={styles.infoRow}>
                  <span>Точка {idx}:</span>
                  <span className="debug-info-value" style={styles.value}>({point.x}, {point.y})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const container: React.CSSProperties = {
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  color: '#0f0',
  padding: '10px',
  borderRadius: '6px',
  fontFamily: 'monospace',
  fontSize: '10px',
  maxHeight: 'calc(100vh - 20px)',
  overflowY: 'auto',
  border: '1px solid #0f0',
};

const columnsContainer: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const column: React.CSSProperties = {
  flex: 1,
  minWidth: '200px',
};

const mainTitle: React.CSSProperties = {
  margin: '0 0 8px 0',
  color: '#0ff',
  fontSize: '13px',
  textAlign: 'center',
  borderBottom: '1px solid #0ff',
  paddingBottom: '4px',
};

const section: React.CSSProperties = {
  marginBottom: '8px',
  padding: '6px',
  backgroundColor: 'rgba(0, 255, 0, 0.05)',
  borderRadius: '4px',
  border: '1px solid rgba(0, 255, 0, 0.3)',
};

const sectionTitle: React.CSSProperties = {
  margin: '0 0 4px 0',
  color: '#0ff',
  fontSize: '11px',
  borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
  paddingBottom: '2px',
};

const info: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const infoRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '2px 0',
};

const value: React.CSSProperties = {
  color: '#fff',
  fontWeight: 'bold',
};

const highlight: React.CSSProperties = {
  color: '#ff0',
  fontWeight: 'bold',
};

const subsection: React.CSSProperties = {
  marginTop: '4px',
  paddingLeft: '6px',
  borderLeft: '2px solid rgba(0, 255, 0, 0.3)',
};

const subsectionTitle: React.CSSProperties = {
  color: '#0f0',
  fontSize: '10px',
  marginBottom: '3px',
  fontWeight: 'bold',
};

const entityCard: React.CSSProperties = {
  marginBottom: '4px',
  padding: '4px',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  borderRadius: '3px',
  border: '1px solid rgba(0, 255, 0, 0.2)',
};

const entityHeader: React.CSSProperties = {
  color: '#ff0',
  fontSize: '10px',
  marginBottom: '2px',
  fontWeight: 'bold',
};

const entityDetails: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
  fontSize: '9px',
  color: '#0f0',
};

const moreInfo: React.CSSProperties = {
  color: '#888',
  fontSize: '10px',
  fontStyle: 'italic',
  textAlign: 'center',
  marginTop: '4px',
};

const sliderContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '4px',
};

const slider: React.CSSProperties = {
  flex: 1,
  height: '6px',
  cursor: 'pointer',
};

const speedValue: React.CSSProperties = {
  color: '#ff0',
  fontWeight: 'bold',
  fontSize: '12px',
  minWidth: '50px',
  textAlign: 'right',
};

const styles = {
  container,
  columnsContainer,
  column,
  mainTitle,
  section,
  sectionTitle,
  info,
  infoRow,
  value,
  highlight,
  subsection,
  subsectionTitle,
  entityCard,
  entityHeader,
  entityDetails,
  moreInfo,
  sliderContainer,
  slider,
  speedValue,
};
