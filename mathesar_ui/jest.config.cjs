const data = require('./tsconfig.json');

function getAlias() {
  const moduleNameMapper = {};
  const { paths } = data.compilerOptions;
  Object.keys(paths).forEach((key) => {
    const location = paths[key][0].replace('*', '$1');
    moduleNameMapper[`^${key.replace('*', '(.*)$')}`] = `<rootDir>/${location}`;
  });
  return moduleNameMapper;
}

module.exports = {
  testEnvironment: 'jsdom',
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
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.cjs',
    ...getAlias(),
  },
  moduleFileExtensions: ['js', 'ts', 'svelte', 'cjs'],
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
};
