import { Board } from './board.js';

describe('Board class', () => {
  test('should initialize with correct days and hours', () => {
    const board = new Board();
    expect(board.days).toEqual(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
    expect(board.hours).toEqual(['07:00','08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00']);
  });

  test('should have schedule for each day and each hour', () => {
    const board = new Board();
    board.days.forEach(day => {
      expect(board.schedule[day]).toBeDefined();
      board.hours.forEach(hour => {
        expect(board.schedule[day][hour]).toBeDefined();
        expect(['free', 'occupied']).toContain(board.schedule[day][hour]);
      });
    });
  });
});