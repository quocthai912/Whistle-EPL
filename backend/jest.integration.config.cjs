module.exports = {
  ...require('./jest.config.cjs'),
  testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
  testTimeout: 20000,
  setupFiles: ['<rootDir>/tests/fixtures/integration-environment.ts'],
};
