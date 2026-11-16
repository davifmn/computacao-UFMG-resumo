import { Worker } from './worker.js';

describe('Worker model', () => {
  test('should have schema defined', () => {
    expect(Worker.schema).toBeDefined();
  });
});