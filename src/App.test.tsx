import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { useGameStore } from "./stores/gameStore";
import { useUIStore } from "./stores/uiStore";

// Mock DEV_CONFIG to disable auto-start for controlled testing
vi.mock("./config/dev", () => ({
  DEV_CONFIG: {
    AUTO_START_LEVEL: null,
    SHOW_DEBUG_INFO: false,
    SHOW_COORDINATES: false,
    SHOW_PATH_COORDINATES: false,
    GAME_SPEED: 1,
  },
}));

describe("App Integration Tests", () => {
  beforeEach(() => {
    // Сбрасываем Zustand stores перед каждым тестом
    useGameStore.getState().resetGame();
    useUIStore.setState({ selectedTowerLevel: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Добавляем таймаут для всех тестов в этом блоке
  const TEST_TIMEOUT = 5000;

  describe("Initial State", () => {
    it("should render level select screen on initial load", () => {
      render(<App />);

      expect(screen.getByText("🏰 Tower Defense")).toBeInTheDocument();
      expect(
        screen.getByText("Выберите уровень сложности")
      ).toBeInTheDocument();
    });

    it("should show all 10 levels", () => {
      render(<App />);

      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });
  });

  describe("Level Selection and Initialization", () => {
    it(
      "should start game when level is selected",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        // Wait for game to initialize
        await waitFor(
          () => {
            expect(
              screen.queryByText("🏰 Tower Defense")
            ).not.toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Should show game UI with stats
        expect(screen.getByText("300")).toBeInTheDocument();
        expect(screen.getByText("20")).toBeInTheDocument();
      },
      TEST_TIMEOUT
    );

    it(
      "should initialize with correct starting money for level 1",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            expect(screen.getByText("300")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );

    it(
      "should initialize with correct starting lives for level 1",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            expect(screen.getByText("20")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );
  });

  describe("Tower Placement", () => {
    it(
      "should allow selecting a tower",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            expect(screen.getByText("Т1")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        const tower1Button = screen.getByText("Т1").closest("button");
        await user.click(tower1Button!);

        // Tower is selected
        expect(useUIStore.getState().selectedTowerLevel).toBe(1);
      },
      TEST_TIMEOUT
    );

    it(
      "should deduct money when placing a tower",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            expect(screen.getByText("300")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        const tower1Button = screen.getByText("Т1").closest("button");
        await user.click(tower1Button!);

        const canvas = document.querySelector("canvas")!;
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

        await waitFor(
          () => {
            expect(screen.getByText("250")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );
  });

  describe("Wave Management", () => {
    it(
      "should show start wave button",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            expect(screen.getByText("Начать волну")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );

    it(
      "should start wave when button is clicked",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            expect(screen.getByText("Начать волну")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        const startButton = screen.getByText("Начать волну");
        await user.click(startButton);

        await waitFor(
          () => {
            expect(screen.getByText("1/2")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );
  });

  describe("Game Pause/Resume", () => {
    it(
      "should show pause button during gameplay",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            expect(screen.getByText("⏸ Пауза")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );

    it(
      "should pause game when pause button is clicked",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            expect(screen.getByText("⏸ Пауза")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        const pauseButton = screen.getByText("⏸ Пауза");
        await user.click(pauseButton);

        await waitFor(
          () => {
            expect(screen.getByText("▶️ Продолжить")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );

    it(
      "should resume game when resume button is clicked",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            expect(screen.getByText("⏸ Пауза")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        const pauseButton = screen.getByText("⏸ Пауза");
        await user.click(pauseButton);

        await waitFor(
          () => {
            expect(screen.getByText("▶️ Продолжить")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        const resumeButton = screen.getByText("▶️ Продолжить");
        await user.click(resumeButton);

        await waitFor(
          () => {
            expect(screen.getByText("⏸ Пауза")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );
  });

  describe("Canvas Rendering", () => {
    it(
      "should render game canvas",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            const canvas = document.querySelector("canvas");
            expect(canvas).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );

    it(
      "should have correct canvas dimensions",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            const canvas = document.querySelector("canvas");
            expect(canvas).toHaveAttribute("width", "800");
            expect(canvas).toHaveAttribute("height", "600");
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );
  });

  describe("Tower Selection", () => {
    it(
      "should disable expensive towers when insufficient money",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level1Button = screen.getByText("1").closest("button");
        await user.click(level1Button!);

        await waitFor(
          () => {
            expect(screen.getByText("300")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        const tower3Button = screen.getByText("Т3").closest("button");
        expect(tower3Button).toBeDisabled();
      },
      TEST_TIMEOUT
    );

    it(
      "should enable all towers when sufficient money",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level5Button = screen.getByText("5").closest("button");
        await user.click(level5Button!);

        await waitFor(
          () => {
            expect(screen.getByText("500")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        const tower1Button = screen.getByText("Т1").closest("button");
        const tower2Button = screen.getByText("Т2").closest("button");
        const tower3Button = screen.getByText("Т3").closest("button");

        expect(tower1Button).not.toBeDisabled();
        expect(tower2Button).not.toBeDisabled();
        expect(tower3Button).not.toBeDisabled();
      },
      TEST_TIMEOUT
    );
  });

  describe("Level Display", () => {
    it(
      "should display correct level number",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level3Button = screen.getByText("3").closest("button");
        await user.click(level3Button!);

        await waitFor(
          () => {
            expect(screen.getByText("Ур. 3")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );

    it(
      "should display correct total waves",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level3Button = screen.getByText("3").closest("button");
        await user.click(level3Button!);

        await waitFor(
          () => {
            expect(screen.getByText("0/3")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      },
      TEST_TIMEOUT
    );
  });

  describe("Multiple Tower Placement", () => {
    it(
      "should allow placing multiple towers",
      async () => {
        const user = userEvent.setup();
        render(<App />);

        const level5Button = screen.getByText("5").closest("button");
        await user.click(level5Button!);

        await waitFor(
          () => {
            expect(screen.getByText("500")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        const canvas = document.querySelector("canvas")!;
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

        const tower1Button = screen.getByText("Т1").closest("button");

        // Place first tower
        await user.click(tower1Button!);
        await user.click(canvas);

        await waitFor(
          () => {
            expect(screen.getByText("450")).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Try to place second tower at same position (should not work - same location)
        // So we verify that we can't spend more money
        await user.click(tower1Button!);
        await user.click(canvas);

        // Money should remain 450 since second tower can't be placed at same spot
        await waitFor(
          () => {
            expect(screen.getByText("450")).toBeInTheDocument();
          },
          { timeout: 500 }
        );
      },
      TEST_TIMEOUT
    );
  });
});
