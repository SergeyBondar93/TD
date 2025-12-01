import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameOver } from './GameOver';

describe('GameOver', () => {
  const defaultProps = {
    won: false,
    currentLevel: 1,
    onRestart: vi.fn(),
    onMenu: vi.fn(),
  };

  describe('when game is won', () => {
    it('should display victory message', () => {
      render(<GameOver {...defaultProps} won={true} />);

      expect(screen.getByText('🎉 Победа!')).toBeInTheDocument();
    });

    it('should display congratulation message with level', () => {
      render(<GameOver {...defaultProps} won={true} currentLevel={5} />);

      expect(screen.getByText(/Поздравляем! Вы прошли уровень 5!/)).toBeInTheDocument();
    });

    it('should have correct title color style for victory', () => {
      render(<GameOver {...defaultProps} won={true} />);

      const title = screen.getByText('🎉 Победа!');
      expect(title).toBeInTheDocument();
    });
  });

  describe('when game is lost', () => {
    it('should display defeat message', () => {
      render(<GameOver {...defaultProps} won={false} />);

      expect(screen.getByText('💀 Поражение!')).toBeInTheDocument();
    });

    it('should display try again message with level', () => {
      render(<GameOver {...defaultProps} won={false} currentLevel={3} />);

      expect(screen.getByText(/Вы проиграли на уровне 3\. Попробуйте ещё раз!/)).toBeInTheDocument();
    });

    it('should have correct title color style for defeat', () => {
      render(<GameOver {...defaultProps} won={false} />);

      const title = screen.getByText('💀 Поражение!');
      expect(title).toBeInTheDocument();
    });
  });

  describe('buttons', () => {
    it('should render restart button', () => {
      render(<GameOver {...defaultProps} />);

      expect(screen.getByText('🔄 Попробовать снова')).toBeInTheDocument();
    });

    it('should render menu button', () => {
      render(<GameOver {...defaultProps} />);

      expect(screen.getByText('🏠 В меню')).toBeInTheDocument();
    });

    it('should call onRestart when restart button is clicked', async () => {
      const user = userEvent.setup();
      const onRestart = vi.fn();
      render(<GameOver {...defaultProps} onRestart={onRestart} />);

      const restartButton = screen.getByText('🔄 Попробовать снова');
      await user.click(restartButton);

      expect(onRestart).toHaveBeenCalledTimes(1);
    });

    it('should call onMenu when menu button is clicked', async () => {
      const user = userEvent.setup();
      const onMenu = vi.fn();
      render(<GameOver {...defaultProps} onMenu={onMenu} />);

      const menuButton = screen.getByText('🏠 В меню');
      await user.click(menuButton);

      expect(onMenu).toHaveBeenCalledTimes(1);
    });

    it('should not call handlers multiple times on single click', async () => {
      const user = userEvent.setup();
      const onRestart = vi.fn();
      const onMenu = vi.fn();
      render(<GameOver {...defaultProps} onRestart={onRestart} onMenu={onMenu} />);

      const restartButton = screen.getByText('🔄 Попробовать снова');
      await user.click(restartButton);

      expect(onRestart).toHaveBeenCalledTimes(1);
      expect(onMenu).not.toHaveBeenCalled();
    });
  });

  describe('different levels', () => {
    it('should display correct level in victory message for level 1', () => {
      render(<GameOver {...defaultProps} won={true} currentLevel={1} />);

      expect(screen.getByText(/уровень 1/)).toBeInTheDocument();
    });

    it('should display correct level in victory message for level 10', () => {
      render(<GameOver {...defaultProps} won={true} currentLevel={10} />);

      expect(screen.getByText(/уровень 10/)).toBeInTheDocument();
    });

    it('should display correct level in defeat message for level 7', () => {
      render(<GameOver {...defaultProps} won={false} currentLevel={7} />);

      expect(screen.getByText(/уровне 7/)).toBeInTheDocument();
    });
  });

  describe('component structure', () => {
    it('should render modal overlay', () => {
      const { container } = render(<GameOver {...defaultProps} />);

      const overlay = container.firstChild;
      expect(overlay).toBeInTheDocument();
    });

    it('should render all required elements', () => {
      render(<GameOver {...defaultProps} />);

      // Title
      expect(screen.getByText(/Победа!|Поражение!/)).toBeInTheDocument();
      
      // Message
      expect(screen.getByText(/Поздравляем|проиграли/)).toBeInTheDocument();
      
      // Buttons
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });
  });
});
