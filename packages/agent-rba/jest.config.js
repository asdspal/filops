module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/__tests__/**'],
  moduleNameMapper: {
    '^@filops/common$': '<rootDir>/../common/src',
    '^@filops/database$': '<rootDir>/../database/src',
    '^@filops/events$': '<rootDir>/../events/src',
    '^@filops/policy-engine$': '<rootDir>/../policy-engine/src',
    '^@filops/integrations$': '<rootDir>/../integrations/src',
    '^@filops/agent-orchestrator$': '<rootDir>/../agent-orchestrator/src',
  },
};
