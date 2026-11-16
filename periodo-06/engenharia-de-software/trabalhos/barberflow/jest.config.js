export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'packages/board.js',
    'packages/user.js',
    'packages/worker.js',
    'routes/authRoutes.js',
    // workerRoutes.js fica fora da meta de cobertura por enquanto
    // 'routes/workerRoutes.js',
    '!**/*.test.js',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
};