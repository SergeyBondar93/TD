import React from 'react';
import { LEVELS } from '../config/levels';

interface LevelSelectProps {
  onSelectLevel: (level: number) => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({ onSelectLevel }) => {
  return (
    <div className="level-select-container" style={styles.container}>
      <h1 className="level-select-title" style={styles.title}>🏰 Tower Defense</h1>
      <p className="level-select-subtitle" style={styles.subtitle}>Выберите уровень сложности</p>
      
      <div className="level-select-grid" style={styles.levelGrid}>
        {LEVELS.map((level) => (
          <button
            key={level.level}
            className={`level-select-button level-select-level-${level.level}`}
            onClick={() => onSelectLevel(level.level)}
            style={styles.levelButton}
          >
            <div className="level-select-number" style={styles.levelNumber}>{level.level}</div>
            <div className="level-select-info" style={styles.levelInfo}>
              <div className="level-select-money">💰 {level.startingMoney}</div>
              <div className="level-select-lives">❤️ {level.startingLives}</div>
              <div className="level-select-waves">🌊 {level.waves.length} волн</div>
            </div>
          </button>
        ))}
      </div>

      <div className="level-select-instructions" style={styles.instructions}>
        <h3 className="level-select-instructions-title" style={styles.instructionsTitle}>Как играть:</h3>
        <ul className="level-select-instructions-list" style={styles.instructionsList}>
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

const container: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '40px',
  backgroundColor: '#1a1a2e',
  minHeight: '100vh',
  color: '#fff',
};

const title: React.CSSProperties = {
  fontSize: '48px',
  margin: '0 0 10px 0',
  color: '#4ecdc4',
  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
};

const subtitle: React.CSSProperties = {
  fontSize: '24px',
  margin: '0 0 40px 0',
  color: '#e94560',
};

const levelGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '20px',
  marginBottom: '40px',
  maxWidth: '800px',
};

const levelButton: React.CSSProperties = {
  padding: '20px',
  backgroundColor: '#16213e',
  border: '3px solid #0f3460',
  borderRadius: '12px',
  color: '#fff',
  cursor: 'pointer',
  transition: 'all 0.3s',
  fontSize: '14px',
  minWidth: '120px',
};

const levelNumber: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#4ecdc4',
  marginBottom: '10px',
};

const levelInfo: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  fontSize: '14px',
};

const instructions: React.CSSProperties = {
  backgroundColor: '#16213e',
  padding: '25px',
  borderRadius: '12px',
  maxWidth: '600px',
  border: '2px solid #0f3460',
};

const instructionsTitle: React.CSSProperties = {
  color: '#4ecdc4',
  margin: '0 0 15px 0',
};

const instructionsList: React.CSSProperties = {
  margin: 0,
  paddingLeft: '20px',
  lineHeight: '1.8',
};

const styles = {
  container,
  title,
  subtitle,
  levelGrid,
  levelButton,
  levelNumber,
  levelInfo,
  instructions,
  instructionsTitle,
  instructionsList,
};
