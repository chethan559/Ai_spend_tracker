// Load .env.test BEFORE Jest processes any files so Prisma picks up the
// test DATABASE_URL at module-import time, not the production one from .env.
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.test'), override: true });

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  maxWorkers: 1,
  // Runs before every test file — enforces the production-DB guard.
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/testSafetyGuard.ts'],
};
