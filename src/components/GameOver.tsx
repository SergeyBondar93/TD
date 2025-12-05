import React from "react";

interface GameOverProps {
  won: boolean;
  currentLevel: number;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  won,
  currentLevel,
  onRestart,
  onMenu,
}) => {
  return (
    <div className="game-over-overlay" style={styles.overlay}>
      <div className="game-over-modal" style={styles.modal}>
        <h1
          className={`game-over-title ${won ? "won" : "lost"}`}
          style={won ? styles.wonTitle : styles.lostTitle}
        >
          {won ? "🎉 Победа!" : "💀 Поражение!"}
        </h1>
        <p className="game-over-message" style={styles.message}>
          {won
            ? `Поздравляем! Вы прошли уровень ${currentLevel}!`
            : `Вы проиграли на уровне ${currentLevel}. Попробуйте ещё раз!`}
        </p>
        <div className="game-over-buttons" style={styles.buttons}>
          <button
            className="game-over-button game-over-restart-button"
            onClick={onRestart}
            style={{ ...styles.button, ...styles.restartButton }}
          >
            🔄 Попробовать снова
          </button>
          <button
            className="game-over-button game-over-menu-button"
            onClick={onMenu}
            style={{ ...styles.button, ...styles.menuButton }}
          >
            🏠 В меню
          </button>
        </div>
      </div>
    </div>
  );
};

const overlay: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  backgroundColor: "#16213e",
  padding: "50px",
  borderRadius: "20px",
  textAlign: "center",
  border: "3px solid #0f3460",
  maxWidth: "500px",
};

const wonTitle: React.CSSProperties = {
  fontSize: "48px",
  color: "#2ecc71",
  margin: "0 0 20px 0",
};

const lostTitle: React.CSSProperties = {
  fontSize: "48px",
  color: "#e74c3c",
  margin: "0 0 20px 0",
};

const message: React.CSSProperties = {
  fontSize: "20px",
  color: "#fff",
  margin: "0 0 30px 0",
};

const buttons: React.CSSProperties = {
  display: "flex",
  gap: "15px",
  justifyContent: "center",
};

const button: React.CSSProperties = {
  padding: "15px 30px",
  fontSize: "18px",
  fontWeight: "bold",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.3s",
};

const restartButton: React.CSSProperties = {
  backgroundColor: "#3498db",
  color: "#fff",
};

const menuButton: React.CSSProperties = {
  backgroundColor: "#95a5a6",
  color: "#fff",
};

const styles = {
  overlay,
  modal,
  wonTitle,
  lostTitle,
  message,
  buttons,
  button,
  restartButton,
  menuButton,
};
