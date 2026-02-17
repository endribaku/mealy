import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',

  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/tests/**/*.test.ts'],

  moduleNameMapper: {
    '^@mealy/engine(.*)$': '<rootDir>/../engine/src$1',
    '^@mealy/data(.*)$': '<rootDir>/../data/src$1'
  },


  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
}

export default config
