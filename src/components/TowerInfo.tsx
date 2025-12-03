import React from 'react';
import type { Tower } from '../types/game';
import { WeaponType } from '../types/game';
import { TOWER_STATS } from '../config/gameData/towers';
import { DEV_CONFIG } from '../config/dev';

interface TowerInfoProps {
  tower: Tower | null;
  money: number;
  onUpgrade: () => void;
  onSell: () => void;
  onClose: () => void;
}

const MAX_UPGRADES = 5;

export const TowerInfo: React.FC<TowerInfoProps> = ({ tower, money, onUpgrade, onSell, onClose }) => {
  if (!tower) return null;

  const totalUpgradeLevel = tower.upgradeLevel + tower.upgradeQueue;
  const canUpgrade = totalUpgradeLevel < MAX_UPGRADES;
  const nextUpgradeStats = TOWER_STATS[tower.level][totalUpgradeLevel + 1];
  const upgradeCost = canUpgrade && nextUpgradeStats ? nextUpgradeStats.upgradeCost ?? 0 : 0;
  const canAffordUpgrade = money >= upgradeCost;
  const isBuilding = tower.buildTimeRemaining > 0;
  
  // Расчет стоимости продажи (70% от базовой стоимости + все улучшения + улучшения в очереди)
  const completedUpgrades = Array.from({ length: tower.upgradeLevel }, (_, i) => {
    const stats = TOWER_STATS[tower.level][i + 1];
    return stats?.upgradeCost ?? 0;
  }).reduce((sum, cost) => sum + cost, 0);
  
  const queuedUpgrades = Array.from({ length: tower.upgradeQueue }, (_, i) => {
    const stats = TOWER_STATS[tower.level][tower.upgradeLevel + i + 1];
    return stats?.upgradeCost ?? 0;
  }).reduce((sum, cost) => sum + cost, 0);
  
  const totalInvested = tower.cost + completedUpgrades + queuedUpgrades;
  const sellValue = Math.round(totalInvested * 0.7);

  const getWeaponTypeName = (type: WeaponType): string => {
    switch (type) {
      case WeaponType.PROJECTILE: return 'Снаряды';
      case WeaponType.LASER: return 'Лазер';
      case WeaponType.ELECTRIC: return 'Электричество';
      case WeaponType.FIRE: return 'Огонь';
      case WeaponType.ICE: return 'Лёд';
      default: return 'Неизвестно';
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: 'absolute',
      right: '20px',
      top: '120px',
      width: '280px',
      backgroundColor: 'rgba(30, 30, 40, 0.95)',
      border: '2px solid #4a90e2',
      borderRadius: '8px',
      padding: '15px',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
      fontFamily: 'Arial, sans-serif',
      zIndex: 100,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
      paddingBottom: '10px',
      borderBottom: '1px solid #4a90e2',
    },
    title: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#4ecdc4',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#fff',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '0 5px',
      opacity: 0.7,
    },
    section: {
      marginBottom: '12px',
    },
    label: {
      fontSize: '12px',
      color: '#aaa',
      marginBottom: '4px',
    },
    value: {
      fontSize: '14px',
      color: '#fff',
      fontWeight: 'bold',
    },
    upgradeSection: {
      marginTop: '15px',
      paddingTop: '15px',
      borderTop: '1px solid #4a90e2',
    },
    upgradeLevel: {
      fontSize: '14px',
      color: '#ffd700',
      marginBottom: '10px',
      textAlign: 'center' as const,
    },
    upgradeButton: {
      width: '100%',
      padding: '10px',
      fontSize: '14px',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '8px',
    },
    upgradeButtonEnabled: {
      backgroundColor: '#4ecdc4',
      color: '#1a1a2e',
    },
    upgradeButtonDisabled: {
      backgroundColor: '#555',
      color: '#888',
      cursor: 'not-allowed',
    },
    sellButton: {
      backgroundColor: '#e74c3c',
      color: '#fff',
    },
    upgradeInfo: {
      fontSize: '11px',
      color: '#aaa',
      textAlign: 'center' as const,
      marginTop: '8px',
      lineHeight: '1.4',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>Башня Ур.{tower.level}</div>
        <button 
          style={styles.closeButton} 
          onClick={onClose}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          ✕
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.label}>Тип оружия</div>
        <div style={styles.value}>{getWeaponTypeName(tower.weaponType)}</div>
      </div>

      {isBuilding && (
        <div style={styles.section}>
          <div style={styles.label}>
            {tower.upgradeQueue > 0 ? 'Улучшение...' : 'Строительство...'}
          </div>
          <div style={styles.value}>
            {(tower.buildTimeRemaining / 1000).toFixed(1)}с
          </div>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.section}>
          <div style={styles.label}>Урон</div>
          <div style={styles.value}>{tower.damage.toFixed(1)}</div>
        </div>
        <div style={styles.section}>
          <div style={styles.label}>Дальность</div>
          <div style={styles.value}>{tower.range.toFixed(0)}</div>
        </div>
        <div style={styles.section}>
          <div style={styles.label}>Скорострельность</div>
          <div style={styles.value}>{tower.fireRate.toFixed(1)}/сек</div>
        </div>
        <div style={styles.section}>
          <div style={styles.label}>Стоимость</div>
          <div style={styles.value}>${tower.cost}</div>
        </div>
      </div>

      <div style={styles.upgradeSection}>
        <div style={styles.upgradeLevel}>
          Улучшение: {tower.upgradeLevel}/{MAX_UPGRADES}
          {tower.upgradeQueue > 0 && ` (+${tower.upgradeQueue} в очереди)`}
        </div>
        
        {canUpgrade ? (
          <>
            <button
              style={{
                ...styles.upgradeButton,
                ...(canAffordUpgrade ? styles.upgradeButtonEnabled : styles.upgradeButtonDisabled),
              }}
              onClick={canAffordUpgrade ? onUpgrade : undefined}
              disabled={!canAffordUpgrade}
              onMouseEnter={(e) => {
                if (canAffordUpgrade) {
                  e.currentTarget.style.backgroundColor = '#45b8ae';
                }
              }}
              onMouseLeave={(e) => {
                if (canAffordUpgrade) {
                  e.currentTarget.style.backgroundColor = '#4ecdc4';
                }
              }}
            >
              Улучшить за ${upgradeCost}
            </button>
            <div style={styles.upgradeInfo}>
              {nextUpgradeStats ? (
                <>
                  Урон: {tower.damage.toFixed(1)} → {nextUpgradeStats.damage.toFixed(1)}<br />
                  Дальность: {tower.range.toFixed(0)} → {nextUpgradeStats.range.toFixed(0)}<br />
                  Скорость: {tower.fireRate.toFixed(1)} → {nextUpgradeStats.fireRate.toFixed(1)}
                </>
              ) : null}
            </div>
          </>
        ) : (
          <div style={{ ...styles.value, textAlign: 'center' as const, color: '#ffd700' }}>
            Максимальный уровень!
          </div>
        )}
      </div>

      {/* Кнопка продажи */}
      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #4a90e2' }}>
        <button
          style={{
            ...styles.upgradeButton,
            ...styles.sellButton,
          }}
          onClick={onSell}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#c0392b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#e74c3c';
          }}
        >
          Продать за ${sellValue}
        </button>
        <div style={{ ...styles.upgradeInfo, textAlign: 'center' as const }}>
          70% от вложенных средств
        </div>
      </div>
    </div>
  );
};
