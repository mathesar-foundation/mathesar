module.exports = {
  transform: {
    '^.+\\.svelte$': [
      'svelte-jester',
      {
        preprocess: true,
      },
    ],
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@mathesar-components': '<rootDir>/src/components/index.ts',
    '^@mathesar(.*)$': '<rootDir>/src$1',
  },
  moduleFileExtensions: ['js', 'ts', 'svelte'],
  setupFilesAfterEnv: [
    '@testing-library/jest-dom/extend-expect',
  ],
};
