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
    <div style={styles.container}>
      {/* Верхняя панель - информация */}
      <div style={styles.topBar}>
        <div style={styles.infoItem}>
          <span style={styles.label}>💰 Деньги:</span>
          <span style={styles.value}>{money}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.label}>❤️ Жизни:</span>
          <span style={styles.value}>{lives}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.label}>🌊 Волна:</span>
          <span style={styles.value}>
            {currentWave}/{totalWaves}
          </span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.label}>📊 Уровень:</span>
          <span style={styles.value}>{currentLevel}</span>
        </div>
      </div>

      {/* Панель башен */}
      <div style={styles.towerPanel}>
        <h3 style={styles.panelTitle}>Башни</h3>
        <div style={styles.towerButtons}>
          {([1, 2, 3] as const).map((level) => {
            const stats = TOWER_STATS[level];
            const isSelected = selectedTowerLevel === level;
            const canAfford = money >= stats.cost;

            return (
              <button
                key={level}
                onClick={() => onSelectTowerLevel(isSelected ? null : level)}
                disabled={!canAfford}
                style={{
                  ...styles.towerButton,
                  ...(isSelected ? styles.towerButtonSelected : {}),
                  ...(canAfford ? {} : styles.towerButtonDisabled),
                }}
              >
                <div style={styles.towerLevel}>Башня {level}</div>
                <div style={styles.towerStats}>
                  <div>💰 {stats.cost}</div>
                  <div>⚔️ {stats.damage}</div>
                  <div>🎯 {stats.range}</div>
                  <div>🔥 {stats.fireRate}/s</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Контролы игры */}
      <div style={styles.controls}>
        {gameStatus === 'playing' && (
          <>
            <button
              onClick={onStartWave}
              disabled={!canStartWave}
              style={{
                ...styles.controlButton,
                ...(canStartWave ? styles.startButton : styles.buttonDisabled),
              }}
            >
              Начать волну
            </button>
            <button onClick={onPause} style={{ ...styles.controlButton, ...styles.pauseButton }}>
              ⏸ Пауза
            </button>
          </>
        )}
        {gameStatus === 'paused' && (
          <button onClick={onResume} style={{ ...styles.controlButton, ...styles.startButton }}>
            ▶️ Продолжить
          </button>
        )}
      </div>

      {/* Подсказки */}
      {selectedTowerLevel && (
        <div style={styles.hint}>Кликните на карте, чтобы поставить башню</div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: '#16213e',
    color: '#fff',
    borderRadius: '8px',
    minWidth: '300px',
  },
  topBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#0f3460',
    borderRadius: '6px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
  },
  label: {
    fontWeight: 'normal',
  },
  value: {
    fontWeight: 'bold',
    color: '#4ecdc4',
  },
  towerPanel: {
    marginBottom: '20px',
  },
  panelTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    color: '#4ecdc4',
  },
  towerButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  towerButton: {
    padding: '12px',
    backgroundColor: '#0f3460',
    border: '2px solid #4ecdc4',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
  },
  towerButtonSelected: {
    backgroundColor: '#4ecdc4',
    color: '#000',
    fontWeight: 'bold',
  },
  towerButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    borderColor: '#555',
  },
  towerLevel: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  towerStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px',
    fontSize: '12px',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
  },
  controlButton: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  startButton: {
    backgroundColor: '#2ecc71',
    color: '#fff',
  },
  pauseButton: {
    backgroundColor: '#f39c12',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  hint: {
    padding: '10px',
    backgroundColor: '#0f3460',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#4ecdc4',
  },
};
