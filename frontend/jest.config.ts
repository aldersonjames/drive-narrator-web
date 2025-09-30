import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { useESM: false, diagnostics: false, tsconfig: '<rootDir>/tsconfig.jest.json' },
    ],
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^react$': '<rootDir>/../node_modules/react',
    '^react-dom$': '<rootDir>/../node_modules/react-dom',
    '^react-dom/test-utils$': '<rootDir>/../node_modules/react-dom/test-utils',
    '^react/jsx-runtime$': '<rootDir>/../node_modules/react/jsx-runtime',
    '\\.(css|less|s[ac]ss)$': '<rootDir>/tests/__mocks__/styleMock.ts',
  },
};

export default config;
