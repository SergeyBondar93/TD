// Скрипт для быстрой замены waitFor на act + advanceTimersByTime
// Паттерны замены:

// Для случаев инициализации после клика по уровню:
// БЫЛО:
/*
const level1Button = screen.getByText('1').closest('button');
await user.click(level1Button!);

await waitFor(() => {
  expect(screen.getByText('Начать волну')).toBeInTheDocument();
});
*/

// СТАЛО:
/*
const level1Button = screen.getByText('1').closest('button');
await user.click(level1Button!);

await act(async () => {
  vi.advanceTimersByTime(150);
});

expect(screen.getByText('Начать волну')).toBeInTheDocument();
*/

// Для синхронных проверок - просто убрать waitFor:
/*
await waitFor(() => {
  expect(screen.getByText('⏸ Пауза')).toBeInTheDocument();
});

// СТАЛО:
expect(screen.getByText('⏸ Пауза')).toBeInTheDocument();
*/
