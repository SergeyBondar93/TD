import React from "react";
import type { Enemy } from "../types/game";
import { DEV_CONFIG } from "../config/dev";

interface DevEnemyDebuggerProps {
  enemy: Enemy | null;
  onUpdate: (updates: Partial<Enemy>) => void;
}

export const DevEnemyDebugger: React.FC<DevEnemyDebuggerProps> = ({
  enemy,
  onUpdate,
}) => {
  if (!DEV_CONFIG.SHOW_DEV_ENEMY || !enemy) {
    return null;
  }

  const [positionX, setPositionX] = React.useState(enemy.position.x.toString());
  const [positionY, setPositionY] = React.useState(enemy.position.y.toString());
  const [positionZ, setPositionZ] = React.useState((enemy.z ?? 0).toString());

  React.useEffect(() => {
    setPositionX(enemy.position.x.toString());
    setPositionY(enemy.position.y.toString());
    setPositionZ((enemy.z ?? 0).toString());
  }, [enemy.position.x, enemy.position.y, enemy.z]);

  const handlePositionChange = (axis: "x" | "y", value: string) => {
    const numValue = parseFloat(value) || 0;
    if (axis === "x") {
      setPositionX(value);
    } else {
      setPositionY(value);
    }
    onUpdate({
      position: {
        ...enemy.position,
        [axis]: numValue,
      },
    });
  };

  const handleNumberChange = (
    field: keyof Enemy,
    value: number,
    min?: number,
    max?: number
  ) => {
    let numValue = value;
    if (min !== undefined && numValue < min) numValue = min;
    if (max !== undefined && numValue > max) numValue = max;
    onUpdate({ [field]: numValue } as Partial<Enemy>);
  };

  return (
    <div className="dev-enemy-debugger" style={styles.container}>
      <h3 className="dev-enemy-debugger-title" style={styles.title}>
        🐛 Dev Enemy Debugger
      </h3>

      {/* Позиция */}
      <div className="dev-enemy-debugger-section" style={styles.section}>
        <h4 style={styles.sectionTitle}>📍 Позиция</h4>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            X:
            <input
              type="number"
              value={positionX}
              onChange={(e) => handlePositionChange("x", e.target.value)}
              onBlur={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                setPositionX(numValue.toString());
                handlePositionChange("x", numValue.toString());
              }}
              style={styles.input}
              step="1"
            />
          </label>
          <label style={styles.label}>
            Y:
            <input
              type="number"
              value={positionY}
              onChange={(e) => handlePositionChange("y", e.target.value)}
              onBlur={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                setPositionY(numValue.toString());
                handlePositionChange("y", numValue.toString());
              }}
              style={styles.input}
              step="1"
            />
          </label>
          <label style={styles.label}>
            Z (высота):
            <input
              type="number"
              value={positionZ}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                setPositionZ(e.target.value);
                onUpdate({ z: numValue });
              }}
              onBlur={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                setPositionZ(numValue.toString());
                onUpdate({ z: numValue });
              }}
              style={styles.input}
              step="0.1"
            />
          </label>
        </div>
      </div>

      {/* Размер */}
      <div className="dev-enemy-debugger-section" style={styles.section}>
        <h4 style={styles.sectionTitle}>📏 Размер</h4>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Size:
            <input
              type="number"
              value={enemy.size}
              onChange={(e) =>
                handleNumberChange("size", parseFloat(e.target.value) || 0, 1)
              }
              style={styles.input}
              step="1"
              min="1"
            />
          </label>
        </div>
      </div>

      {/* Здоровье */}
      <div className="dev-enemy-debugger-section" style={styles.section}>
        <h4 style={styles.sectionTitle}>❤️ Здоровье</h4>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Health:
            <input
              type="number"
              value={enemy.health}
              onChange={(e) =>
                handleNumberChange("health", parseFloat(e.target.value) || 0, 0)
              }
              style={styles.input}
              step="1"
              min="0"
            />
          </label>
          <label style={styles.label}>
            Max Health:
            <input
              type="number"
              value={enemy.maxHealth}
              onChange={(e) =>
                handleNumberChange(
                  "maxHealth",
                  parseFloat(e.target.value) || 0,
                  1
                )
              }
              style={styles.input}
              step="1"
              min="1"
            />
          </label>
        </div>
      </div>

      {/* Скорость и уровень */}
      <div className="dev-enemy-debugger-section" style={styles.section}>
        <h4 style={styles.sectionTitle}>⚡ Параметры</h4>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Speed:
            <input
              type="number"
              value={enemy.speed}
              onChange={(e) =>
                handleNumberChange("speed", parseFloat(e.target.value) || 0, 0)
              }
              style={styles.input}
              step="1"
              min="0"
            />
          </label>
          <label style={styles.label}>
            Level:
            <input
              type="number"
              value={enemy.level}
              onChange={(e) =>
                handleNumberChange("level", parseInt(e.target.value) || 1, 1)
              }
              style={styles.input}
              step="1"
              min="1"
            />
          </label>
        </div>
      </div>

      {/* Награда */}
      <div className="dev-enemy-debugger-section" style={styles.section}>
        <h4 style={styles.sectionTitle}>💰 Награда</h4>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Reward:
            <input
              type="number"
              value={enemy.reward}
              onChange={(e) =>
                handleNumberChange("reward", parseFloat(e.target.value) || 0, 0)
              }
              style={styles.input}
              step="1"
              min="0"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    top: "10px",
    right: "10px",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    border: "2px solid #4a9eff",
    borderRadius: "8px",
    padding: "12px",
    color: "#fff",
    fontFamily: "monospace",
    fontSize: "12px",
    maxWidth: "280px",
    maxHeight: "90vh",
    overflowY: "auto",
    zIndex: 10000,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
  },
  title: {
    margin: "0 0 12px 0",
    padding: "0 0 8px 0",
    borderBottom: "1px solid #4a9eff",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#4a9eff",
  },
  section: {
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(74, 158, 255, 0.3)",
  },
  sectionTitle: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    fontWeight: "bold",
    color: "#a0d0ff",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "11px",
    color: "#e0e0e0",
  },
  input: {
    width: "100px",
    padding: "4px 6px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    border: "1px solid #4a9eff",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "11px",
    fontFamily: "monospace",
    marginLeft: "8px",
  },
};

