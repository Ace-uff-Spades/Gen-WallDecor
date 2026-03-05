module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    // Stub langfuse in tests — avoids dynamic import incompatibility with Jest/CommonJS.
    '^langfuse$': '<rootDir>/__mocks__/langfuse.js',
  },
};
