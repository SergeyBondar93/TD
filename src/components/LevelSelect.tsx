import React from 'react';
import { LEVELS } from '../config/levels';

interface LevelSelectProps {
  onSelectLevel: (level: number) => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({ onSelectLevel }) => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏰 Tower Defense</h1>
      <p style={styles.subtitle}>Выберите уровень сложности</p>
      
      <div style={styles.levelGrid}>
        {LEVELS.map((level) => (
          <button
            key={level.level}
            onClick={() => onSelectLevel(level.level)}
            style={styles.levelButton}
          >
            <div style={styles.levelNumber}>{level.level}</div>
            <div style={styles.levelInfo}>
              <div>💰 {level.startingMoney}</div>
              <div>❤️ {level.startingLives}</div>
              <div>🌊 {level.waves.length} волн</div>
            </div>
          </button>
        ))}
      </div>

      <div style={styles.instructions}>
        <h3 style={styles.instructionsTitle}>Как играть:</h3>
        <ul style={styles.instructionsList}>
          <li>Выберите башню на панели справа</li>
          <li>Кликните на карте, чтобы поставить башню</li>
          <li>Нажмите "Начать волну" для спавна врагов</li>
          <li>Не дайте врагам дойти до конца пути!</li>
          <li>У вас 3 уровня башен с разной силой</li>
        </ul>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    backgroundColor: '#1a1a2e',
    minHeight: '100vh',
    color: '#fff',
  },
  title: {
    fontSize: '48px',
    margin: '0 0 10px 0',
    color: '#4ecdc4',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  },
  subtitle: {
    fontSize: '24px',
    margin: '0 0 40px 0',
    color: '#e94560',
  },
  levelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '20px',
    marginBottom: '40px',
    maxWidth: '800px',
  },
  levelButton: {
    padding: '20px',
    backgroundColor: '#16213e',
    border: '3px solid #0f3460',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontSize: '14px',
    minWidth: '120px',
  },
  levelNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#4ecdc4',
    marginBottom: '10px',
  },
  levelInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontSize: '14px',
  },
  instructions: {
    backgroundColor: '#16213e',
    padding: '25px',
    borderRadius: '12px',
    maxWidth: '600px',
    border: '2px solid #0f3460',
  },
  instructionsTitle: {
    color: '#4ecdc4',
    margin: '0 0 15px 0',
  },
  instructionsList: {
    margin: 0,
    paddingLeft: '20px',
    lineHeight: '1.8',
  },
};
