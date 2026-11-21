module.exports = {
  ...require('./jest.config.cjs'),
  testMatch: [
    '<rootDir>/tests/integration/**/*.spec.ts',
    '<rootDir>/tests/integration/phase-3-*.spec.ts',
  ],
  testTimeout: 20000,
  setupFiles: ['<rootDir>/tests/fixtures/integration-environment.ts'],
};
