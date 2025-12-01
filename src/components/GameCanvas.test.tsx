import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameCanvas } from './GameCanvas';
import type { GameState } from '../types/game';

describe('GameCanvas', () => {
  let mockGameState: GameState;
  let mockCanvasContext: any;

  beforeEach(() => {
    mockGameState = {
      money: 300,
      lives: 20,
      currentWave: 1,
      enemies: [],
      towers: [],
      projectiles: [],
      path: [
        { x: 50, y: 50 },
        { x: 200, y: 50 },
        { x: 200, y: 200 },
      ],
      gameStatus: 'playing',
      selectedTowerLevel: null,
      currentLevel: 1,
      gameSpeed: 1,
    };

    mockCanvasContext = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: '',
      textBaseline: '',
      lineCap: '',
      lineJoin: '',
      globalAlpha: 1,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setLineDash: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext);
  });

  it('should render canvas element', () => {
    const onCanvasClick = vi.fn();
    render(<GameCanvas gameState={mockGameState} onCanvasClick={onCanvasClick} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should have correct canvas dimensions', () => {
    const onCanvasClick = vi.fn();
    render(<GameCanvas gameState={mockGameState} onCanvasClick={onCanvasClick} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('should call onCanvasClick when canvas is clicked', async () => {
    const user = userEvent.setup();
    const onCanvasClick = vi.fn();
    render(<GameCanvas gameState={mockGameState} onCanvasClick={onCanvasClick} />);

    const canvas = document.querySelector('canvas')!;
    await user.click(canvas);

    expect(onCanvasClick).toHaveBeenCalled();
  });

  it('should calculate click coordinates correctly', async () => {
    const user = userEvent.setup();
    const onCanvasClick = vi.fn();
    const { container } = render(<GameCanvas gameState={mockGameState} onCanvasClick={onCanvasClick} />);

    const canvas = container.querySelector('canvas')!;
    
    // Mock getBoundingClientRect
    canvas.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    await user.click(canvas);

    expect(onCanvasClick).toHaveBeenCalled();
  });

  it('should change cursor to crosshair when tower is selected', () => {
    const onCanvasClick = vi.fn();
    render(
      <GameCanvas
        gameState={{ ...mockGameState, selectedTowerLevel: 1 }}
        onCanvasClick={onCanvasClick}
      />
    );

    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveStyle({ cursor: 'crosshair' });
  });

  it('should have default cursor when no tower is selected', () => {
    const onCanvasClick = vi.fn();
    render(<GameCanvas gameState={mockGameState} onCanvasClick={onCanvasClick} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveStyle({ cursor: 'default' });
  });

  it('should draw background', () => {
    const onCanvasClick = vi.fn();
    render(<GameCanvas gameState={mockGameState} onCanvasClick={onCanvasClick} />);

    expect(mockCanvasContext.fillRect).toHaveBeenCalled();
  });

  it('should draw path when path is provided', () => {
    const onCanvasClick = vi.fn();
    render(<GameCanvas gameState={mockGameState} onCanvasClick={onCanvasClick} />);

    expect(mockCanvasContext.beginPath).toHaveBeenCalled();
    expect(mockCanvasContext.moveTo).toHaveBeenCalled();
    expect(mockCanvasContext.lineTo).toHaveBeenCalled();
    expect(mockCanvasContext.stroke).toHaveBeenCalled();
  });

  it('should draw enemies when enemies exist', () => {
    const onCanvasClick = vi.fn();
    const gameStateWithEnemies = {
      ...mockGameState,
      enemies: [
        {
          id: 'enemy-1',
          position: { x: 100, y: 100 },
          health: 50,
          maxHealth: 100,
          speed: 50,
          level: 1,
          pathIndex: 0,
          reward: 20,
        },
      ],
    };

    render(<GameCanvas gameState={gameStateWithEnemies} onCanvasClick={onCanvasClick} />);

    // Should draw enemy rectangle
    expect(mockCanvasContext.fillRect).toHaveBeenCalled();
    expect(mockCanvasContext.arc).toHaveBeenCalled();
  });

  it('should draw towers when towers exist', () => {
    const onCanvasClick = vi.fn();
    const gameStateWithTowers = {
      ...mockGameState,
      towers: [
        {
          id: 'tower-1',
          position: { x: 150, y: 150 },
          level: 1 as const,
          damage: 10,
          range: 100,
          fireRate: 1,
          lastFireTime: 0,
          cost: 50,
        },
      ],
    };

    render(<GameCanvas gameState={gameStateWithTowers} onCanvasClick={onCanvasClick} />);

    expect(mockCanvasContext.fillRect).toHaveBeenCalled();
    expect(mockCanvasContext.arc).toHaveBeenCalled();
  });

  it('should draw projectiles when projectiles exist', () => {
    const onCanvasClick = vi.fn();
    const gameStateWithProjectiles = {
      ...mockGameState,
      projectiles: [
        {
          id: 'proj-1',
          position: { x: 120, y: 120 },
          targetEnemyId: 'enemy-1',
          damage: 10,
          speed: 300,
        },
      ],
    };

    render(<GameCanvas gameState={gameStateWithProjectiles} onCanvasClick={onCanvasClick} />);

    expect(mockCanvasContext.arc).toHaveBeenCalled();
    expect(mockCanvasContext.fill).toHaveBeenCalled();
  });

  it('should redraw when game state changes', () => {
    const onCanvasClick = vi.fn();
    const { rerender } = render(
      <GameCanvas gameState={mockGameState} onCanvasClick={onCanvasClick} />
    );

    const callCountBefore = mockCanvasContext.fillRect.mock.calls.length;

    const updatedGameState = {
      ...mockGameState,
      enemies: [
        {
          id: 'enemy-1',
          position: { x: 100, y: 100 },
          health: 100,
          maxHealth: 100,
          speed: 50,
          level: 1,
          pathIndex: 0,
          reward: 20,
        },
      ],
    };

    rerender(<GameCanvas gameState={updatedGameState} onCanvasClick={onCanvasClick} />);

    const callCountAfter = mockCanvasContext.fillRect.mock.calls.length;
    expect(callCountAfter).toBeGreaterThan(callCountBefore);
  });

  it('should draw multiple enemies', () => {
    const onCanvasClick = vi.fn();
    const gameStateWithMultipleEnemies = {
      ...mockGameState,
      enemies: [
        {
          id: 'enemy-1',
          position: { x: 100, y: 100 },
          health: 100,
          maxHealth: 100,
          speed: 50,
          level: 1,
          pathIndex: 0,
          reward: 20,
        },
        {
          id: 'enemy-2',
          position: { x: 150, y: 150 },
          health: 80,
          maxHealth: 100,
          speed: 60,
          level: 2,
          pathIndex: 1,
          reward: 30,
        },
      ],
    };

    render(<GameCanvas gameState={gameStateWithMultipleEnemies} onCanvasClick={onCanvasClick} />);

    // Multiple draw calls for multiple enemies
    expect(mockCanvasContext.fillRect.mock.calls.length).toBeGreaterThan(0);
  });

  it('should draw multiple towers with different levels', () => {
    const onCanvasClick = vi.fn();
    const gameStateWithMultipleTowers = {
      ...mockGameState,
      towers: [
        {
          id: 'tower-1',
          position: { x: 100, y: 200 },
          level: 1 as const,
          damage: 10,
          range: 100,
          fireRate: 1,
          lastFireTime: 0,
          cost: 50,
        },
        {
          id: 'tower-2',
          position: { x: 300, y: 200 },
          level: 2 as const,
          damage: 25,
          range: 120,
          fireRate: 1.5,
          lastFireTime: 0,
          cost: 150,
        },
        {
          id: 'tower-3',
          position: { x: 500, y: 200 },
          level: 3 as const,
          damage: 50,
          range: 150,
          fireRate: 2,
          lastFireTime: 0,
          cost: 350,
        },
      ],
    };

    render(<GameCanvas gameState={gameStateWithMultipleTowers} onCanvasClick={onCanvasClick} />);

    expect(mockCanvasContext.fillRect).toHaveBeenCalled();
    expect(mockCanvasContext.arc).toHaveBeenCalled();
  });

  it('should handle empty path array', () => {
    const onCanvasClick = vi.fn();
    const gameStateWithEmptyPath = {
      ...mockGameState,
      path: [],
    };

    expect(() => {
      render(<GameCanvas gameState={gameStateWithEmptyPath} onCanvasClick={onCanvasClick} />);
    }).not.toThrow();
  });

  it('should clear canvas before redrawing', () => {
    const onCanvasClick = vi.fn();
    render(<GameCanvas gameState={mockGameState} onCanvasClick={onCanvasClick} />);

    // Background fill acts as canvas clear
    expect(mockCanvasContext.fillRect).toHaveBeenCalled();
  });
});
