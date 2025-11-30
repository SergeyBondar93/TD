import React from 'react';
import type { GameState } from '../types/game';

interface DebugInfoProps {
  gameState: GameState | null;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ gameState }) => {
  if (!gameState) return null;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🔧 Debug Info</h3>
      <div style={styles.info}>
        <div>Enemies: {gameState.enemies.length}</div>
        <div>Towers: {gameState.towers.length}</div>
        <div>Projectiles: {gameState.projectiles.length}</div>
        <div>Current Wave: {gameState.currentWave}</div>
        <div>Status: {gameState.gameStatus}</div>
      </div>
      {gameState.enemies.length > 0 && (
        <div style={styles.enemyList}>
          <h4>Enemies:</h4>
          {gameState.enemies.slice(0, 3).map((enemy) => (
            <div key={enemy.id} style={styles.enemy}>
              <div>Level: {enemy.level}</div>
              <div>HP: {Math.ceil(enemy.health)}/{enemy.maxHealth}</div>
              <div>Pos: ({Math.round(enemy.position.x)}, {Math.round(enemy.position.y)})</div>
              <div>Path: {enemy.pathIndex}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#0f0',
    padding: '15px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
    minWidth: '250px',
    zIndex: 1000,
  },
  title: {
    margin: '0 0 10px 0',
    color: '#0ff',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  enemyList: {
    marginTop: '10px',
    borderTop: '1px solid #0f0',
    paddingTop: '10px',
  },
  enemy: {
    marginBottom: '8px',
    padding: '5px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
  },
};
