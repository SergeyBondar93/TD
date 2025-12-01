import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameUI } from './GameUI';

describe('GameUI', () => {
  const defaultProps = {
    money: 300,
    lives: 20,
    currentWave: 1,
    totalWaves: 5,
    currentLevel: 1,
    gameStatus: 'playing' as const,
    selectedTowerLevel: null as 1 | 2 | 3 | null,
    onSelectTowerLevel: vi.fn(),
    onStartWave: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    canStartWave: true,
  };

  it('should render game stats correctly', () => {
    render(<GameUI {...defaultProps} />);

    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('1/5')).toBeInTheDocument();
    expect(screen.getByText('Ур. 1')).toBeInTheDocument();
  });

  it('should render all three tower buttons', () => {
    render(<GameUI {...defaultProps} />);

    expect(screen.getByText('Т1')).toBeInTheDocument();
    expect(screen.getByText('Т2')).toBeInTheDocument();
    expect(screen.getByText('Т3')).toBeInTheDocument();
  });

  it('should call onSelectTowerLevel when tower button is clicked', async () => {
    const user = userEvent.setup();
    const onSelectTowerLevel = vi.fn();
    
    render(<GameUI {...defaultProps} onSelectTowerLevel={onSelectTowerLevel} />);

    const tower1Button = screen.getByText('Т1').closest('button');
    await user.click(tower1Button!);

    expect(onSelectTowerLevel).toHaveBeenCalledWith(1);
  });

  it('should deselect tower when clicking selected tower button', async () => {
    const user = userEvent.setup();
    const onSelectTowerLevel = vi.fn();
    
    render(
      <GameUI
        {...defaultProps}
        selectedTowerLevel={1}
        onSelectTowerLevel={onSelectTowerLevel}
      />
    );

    const tower1Button = screen.getByText('Т1').closest('button');
    await user.click(tower1Button!);

    expect(onSelectTowerLevel).toHaveBeenCalledWith(null);
  });

  it('should disable tower buttons when insufficient money', () => {
    render(<GameUI {...defaultProps} money={40} />);

    const tower1Button = screen.getByText('Т1').closest('button');
    const tower2Button = screen.getByText('Т2').closest('button');
    const tower3Button = screen.getByText('Т3').closest('button');

    expect(tower1Button).toBeDisabled();
    expect(tower2Button).toBeDisabled();
    expect(tower3Button).toBeDisabled();
  });

  it('should enable tower buttons when sufficient money', () => {
    render(<GameUI {...defaultProps} money={500} />);

    const tower1Button = screen.getByText('Т1').closest('button');
    const tower2Button = screen.getByText('Т2').closest('button');
    const tower3Button = screen.getByText('Т3').closest('button');

    expect(tower1Button).not.toBeDisabled();
    expect(tower2Button).not.toBeDisabled();
    expect(tower3Button).not.toBeDisabled();
  });

  it('should display tower stats correctly', () => {
    render(<GameUI {...defaultProps} />);

    // Tower 1 stats
    expect(screen.getByText('💰50')).toBeInTheDocument();
    expect(screen.getByText('⚔️10')).toBeInTheDocument();
    expect(screen.getByText('🎯100')).toBeInTheDocument();
    expect(screen.getByText('🔥1')).toBeInTheDocument();
  });

  it('should show start wave button when playing', () => {
    render(<GameUI {...defaultProps} gameStatus="playing" />);

    expect(screen.getByText('Начать волну')).toBeInTheDocument();
    expect(screen.getByText('⏸ Пауза')).toBeInTheDocument();
  });

  it('should call onStartWave when start wave button is clicked', async () => {
    const user = userEvent.setup();
    const onStartWave = vi.fn();
    
    render(<GameUI {...defaultProps} onStartWave={onStartWave} />);

    const startButton = screen.getByText('Начать волну');
    await user.click(startButton);

    expect(onStartWave).toHaveBeenCalled();
  });

  it('should disable start wave button when canStartWave is false', () => {
    render(<GameUI {...defaultProps} canStartWave={false} />);

    const startButton = screen.getByText('Начать волну');
    expect(startButton).toBeDisabled();
  });

  it('should call onPause when pause button is clicked', async () => {
    const user = userEvent.setup();
    const onPause = vi.fn();
    
    render(<GameUI {...defaultProps} onPause={onPause} />);

    const pauseButton = screen.getByText('⏸ Пауза');
    await user.click(pauseButton);

    expect(onPause).toHaveBeenCalled();
  });

  it('should show resume button when game is paused', () => {
    render(<GameUI {...defaultProps} gameStatus="paused" />);

    expect(screen.getByText('▶️ Продолжить')).toBeInTheDocument();
    expect(screen.queryByText('Начать волну')).not.toBeInTheDocument();
  });

  it('should call onResume when resume button is clicked', async () => {
    const user = userEvent.setup();
    const onResume = vi.fn();
    
    render(<GameUI {...defaultProps} gameStatus="paused" onResume={onResume} />);

    const resumeButton = screen.getByText('▶️ Продолжить');
    await user.click(resumeButton);

    expect(onResume).toHaveBeenCalled();
  });

  it('should not show control buttons when game is won', () => {
    render(<GameUI {...defaultProps} gameStatus="won" />);

    expect(screen.queryByText('Начать волну')).not.toBeInTheDocument();
    expect(screen.queryByText('⏸ Пауза')).not.toBeInTheDocument();
    expect(screen.queryByText('▶️ Продолжить')).not.toBeInTheDocument();
  });

  it('should not show control buttons when game is lost', () => {
    render(<GameUI {...defaultProps} gameStatus="lost" />);

    expect(screen.queryByText('Начать волну')).not.toBeInTheDocument();
    expect(screen.queryByText('⏸ Пауза')).not.toBeInTheDocument();
    expect(screen.queryByText('▶️ Продолжить')).not.toBeInTheDocument();
  });

  it('should update displayed values when props change', () => {
    const { rerender } = render(<GameUI {...defaultProps} />);

    expect(screen.getByText('300')).toBeInTheDocument();

    rerender(<GameUI {...defaultProps} money={500} />);

    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('should display wave progress correctly', () => {
    render(<GameUI {...defaultProps} currentWave={3} totalWaves={10} />);

    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('should allow selecting different tower levels', async () => {
    const user = userEvent.setup();
    const onSelectTowerLevel = vi.fn();
    
    render(<GameUI {...defaultProps} money={500} onSelectTowerLevel={onSelectTowerLevel} />);

    const tower2Button = screen.getByText('Т2').closest('button');
    const tower3Button = screen.getByText('Т3').closest('button');

    await user.click(tower2Button!);
    expect(onSelectTowerLevel).toHaveBeenCalledWith(2);

    await user.click(tower3Button!);
    expect(onSelectTowerLevel).toHaveBeenCalledWith(3);
  });
});
