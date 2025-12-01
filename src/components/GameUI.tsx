import React from 'react';
import { TOWER_STATS } from '../types/game';

interface GameUIProps {
  money: number;
  lives: number;
  currentWave: number;
  totalWaves: number;
  currentLevel: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'won' | 'lost';
  selectedTowerLevel: 1 | 2 | 3 | null;
  onSelectTowerLevel: (level: 1 | 2 | 3 | null) => void;
  onStartWave: () => void;
  onPause: () => void;
  onResume: () => void;
  canStartWave: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({
  money,
  lives,
  currentWave,
  totalWaves,
  currentLevel,
  gameStatus,
  selectedTowerLevel,
  onSelectTowerLevel,
  onStartWave,
  onPause,
  onResume,
  canStartWave,
}) => {
  return (
    <div className="game-ui-container" style={styles.container}>
      {/* Информационная панель */}
      <div className="game-ui-info-section" style={styles.infoSection}>
        <div className="game-ui-info-item game-ui-money" style={styles.infoItem}>
          <span className="game-ui-label" style={styles.label}>💰</span>
          <span className="game-ui-value" style={styles.value}>{money}</span>
        </div>
        <div className="game-ui-separator" style={styles.separator}></div>
        <div className="game-ui-info-item game-ui-lives" style={styles.infoItem}>
          <span className="game-ui-label" style={styles.label}>❤️</span>
          <span className="game-ui-value" style={styles.value}>{lives}</span>
        </div>
        <div className="game-ui-separator" style={styles.separator}></div>
        <div className="game-ui-info-item game-ui-wave" style={styles.infoItem}>
          <span className="game-ui-label" style={styles.label}>🌊</span>
          <span className="game-ui-value" style={styles.value}>
            {currentWave}/{totalWaves}
          </span>
        </div>
        <div className="game-ui-separator" style={styles.separator}></div>
        <div className="game-ui-info-item game-ui-level" style={styles.infoItem}>
          <span className="game-ui-label" style={styles.label}>📊</span>
          <span className="game-ui-value" style={styles.value}>Ур. {currentLevel}</span>
        </div>
      </div>

      {/* Панель башен */}
      <div className="game-ui-tower-section" style={styles.towerSection}>
        <div className="game-ui-tower-buttons" style={styles.towerButtons}>
          {([1, 2, 3] as const).map((level) => {
            const stats = TOWER_STATS[level];
            const isSelected = selectedTowerLevel === level;
            const canAfford = money >= stats.cost;

            return (
              <button
                key={level}
                className={`game-ui-tower-button game-ui-tower-level-${level} ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
                onClick={() => onSelectTowerLevel(isSelected ? null : level)}
                disabled={!canAfford}
                style={{
                  ...styles.towerButton,
                  ...(isSelected ? styles.towerButtonSelected : {}),
                  ...(canAfford ? {} : styles.towerButtonDisabled),
                }}
              >
                <div className="game-ui-tower-level-text" style={styles.towerLevel}>Т{level}</div>
                <div className="game-ui-tower-stats" style={styles.towerStats}>
                  <div className="game-ui-tower-stat game-ui-tower-cost">💰{stats.cost}</div>
                  <div className="game-ui-tower-stat game-ui-tower-damage">⚔️{stats.damage}</div>
                  <div className="game-ui-tower-stat game-ui-tower-range">🎯{stats.range}</div>
                  <div className="game-ui-tower-stat game-ui-tower-firerate">🔥{stats.fireRate}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Контролы игры */}
      <div className="game-ui-control-section" style={styles.controlSection}>
        {gameStatus === 'playing' && (
          <>
            <button
              className={`game-ui-control-button game-ui-start-wave-button ${!canStartWave ? 'disabled' : ''}`}
              onClick={onStartWave}
              disabled={!canStartWave}
              style={{
                ...styles.controlButton,
                ...(canStartWave ? styles.startButton : styles.buttonDisabled),
              }}
            >
              Начать волну
            </button>
            <button 
              className="game-ui-control-button game-ui-pause-button"
              onClick={onPause} 
              style={{ ...styles.controlButton, ...styles.pauseButton }}
            >
              ⏸ Пауза
            </button>
          </>
        )}
        {gameStatus === 'paused' && (
          <button 
            className="game-ui-control-button game-ui-resume-button"
            onClick={onResume} 
            style={{ ...styles.controlButton, ...styles.startButton }}
          >
            ▶️ Продолжить
          </button>
        )}
      </div>

      {/* Подсказки */}
      {selectedTowerLevel && (
        <div className="game-ui-hint" style={styles.hint}>Кликните на карте, чтобы поставить башню</div>
      )}
    </div>
  );
};

const container: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: '15px',
  padding: '10px',
  backgroundColor: '#16213e',
  color: '#fff',
  borderRadius: '6px',
  width: '100%',
  maxWidth: '100%',
  alignItems: 'flex-start',
};

const infoSection: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: '10px',
  padding: '8px 12px',
  backgroundColor: '#0f3460',
  borderRadius: '6px',
  alignItems: 'center',
};

const towerSection: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flex: 1,
};

const controlSection: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
};

const infoItem: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  alignItems: 'center',
  fontSize: '15px',
};

const separator: React.CSSProperties = {
  width: '1px',
  height: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
};

const label: React.CSSProperties = {
  fontWeight: 'normal',
};

const value: React.CSSProperties = {
  fontWeight: 'bold',
  color: '#4ecdc4',
};

const towerPanel: React.CSSProperties = {
  marginBottom: '20px',
};

const panelTitle: React.CSSProperties = {
  margin: '0 0 15px 0',
  fontSize: '18px',
  color: '#4ecdc4',
};

const towerButtons: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const towerButton: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#0f3460',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderColor: '#4ecdc4',
  borderRadius: '6px',
  color: '#fff',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontSize: '14px',
};

const towerButtonSelected: React.CSSProperties = {
  backgroundColor: '#4ecdc4',
  color: '#000',
  fontWeight: 'bold',
};

const towerButtonDisabled: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
  borderColor: '#555',
};

const towerLevel: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '8px',
};

const towerStats: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '4px',
  fontSize: '12px',
};

const controls: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginBottom: '15px',
};

const controlButton: React.CSSProperties = {
  padding: '12px 20px',
  border: 'none',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const startButton: React.CSSProperties = {
  backgroundColor: '#2ecc71',
  color: '#fff',
};

const pauseButton: React.CSSProperties = {
  backgroundColor: '#f39c12',
  color: '#fff',
};

const buttonDisabled: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

const hint: React.CSSProperties = {
  padding: '10px',
  backgroundColor: '#0f3460',
  borderRadius: '6px',
  textAlign: 'center',
  fontSize: '14px',
  color: '#4ecdc4',
};

const styles = {
  container,
  infoSection,
  towerSection,
  controlSection,
  infoItem,
  separator,
  label,
  value,
  towerPanel,
  panelTitle,
  towerButtons,
  towerButton,
  towerButtonSelected,
  towerButtonDisabled,
  towerLevel,
  towerStats,
  controls,
  controlButton,
  startButton,
  pauseButton,
  buttonDisabled,
  hint,
};
