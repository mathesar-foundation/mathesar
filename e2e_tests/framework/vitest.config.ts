import { defineConfig } from 'vitest/config';
import * as path from 'node:path';

export default defineConfig({
  test: {
    root: path.resolve(__dirname),
    include: ['src/__tests__/**/*.test.ts'],
    // Run test files sequentially — executor now writes to the shared
    // .output/outcomes directory, so parallel file execution causes conflicts.
    fileParallelism: false,
  },
});
