import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LevelSelect } from './LevelSelect';

describe('LevelSelect', () => {
  it('should render the title', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelect onSelectLevel={onSelectLevel} />);

    expect(screen.getByText('🏰 Tower Defense')).toBeInTheDocument();
    expect(screen.getByText('Выберите уровень сложности')).toBeInTheDocument();
  });

  it('should render all 10 level buttons', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelect onSelectLevel={onSelectLevel} />);

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  it('should display level information', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelect onSelectLevel={onSelectLevel} />);

    // Level 1 should have starting money 300
    expect(screen.getByText('💰 300')).toBeInTheDocument();
    // Level 1 should have starting lives 20 (multiple levels have this)
    expect(screen.getAllByText('❤️ 20').length).toBeGreaterThan(0);
    // Level 1 should have 2 waves (multiple levels have this)
    expect(screen.getAllByText('🌊 2 волн').length).toBeGreaterThan(0);
  });

  it('should call onSelectLevel with correct level when button is clicked', async () => {
    const user = userEvent.setup();
    const onSelectLevel = vi.fn();
    render(<LevelSelect onSelectLevel={onSelectLevel} />);

    const level1Button = screen.getByText('1').closest('button');
    await user.click(level1Button!);

    expect(onSelectLevel).toHaveBeenCalledWith(1);
  });

  it('should call onSelectLevel with different levels', async () => {
    const user = userEvent.setup();
    const onSelectLevel = vi.fn();
    render(<LevelSelect onSelectLevel={onSelectLevel} />);

    const level3Button = screen.getByText('3').closest('button');
    const level5Button = screen.getByText('5').closest('button');
    const level10Button = screen.getByText('10').closest('button');

    await user.click(level3Button!);
    expect(onSelectLevel).toHaveBeenCalledWith(3);

    await user.click(level5Button!);
    expect(onSelectLevel).toHaveBeenCalledWith(5);

    await user.click(level10Button!);
    expect(onSelectLevel).toHaveBeenCalledWith(10);
  });

  it('should render instructions section', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelect onSelectLevel={onSelectLevel} />);

    expect(screen.getByText('Как играть:')).toBeInTheDocument();
    expect(screen.getByText(/Выберите башню на панели/)).toBeInTheDocument();
    expect(screen.getByText(/Начать волну/)).toBeInTheDocument();
    expect(screen.getByText(/Не дайте врагам/)).toBeInTheDocument();
    expect(screen.getByText(/3 уровня башен/)).toBeInTheDocument();
  });

  it('should render all level buttons as clickable', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelect onSelectLevel={onSelectLevel} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(10);

    buttons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should display different money amounts for different levels', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelect onSelectLevel={onSelectLevel} />);

    // Check that multiple different money amounts are displayed
    expect(screen.getByText('💰 300')).toBeInTheDocument(); // Level 1
    expect(screen.getByText('💰 350')).toBeInTheDocument(); // Level 2
    expect(screen.getByText('💰 400')).toBeInTheDocument(); // Level 3
  });

  it('should display different wave counts for different levels', () => {
    const onSelectLevel = vi.fn();
    render(<LevelSelect onSelectLevel={onSelectLevel} />);

    // Different levels should have different wave counts
    expect(screen.getAllByText('🌊 2 волн').length).toBeGreaterThan(0); // Levels 1, 2, 4, etc
    expect(screen.getAllByText('🌊 3 волн').length).toBeGreaterThan(0); // Levels 3, 5, etc
  });
});
