import { defineConfig } from 'vitest/config';
import * as path from 'node:path';

export default defineConfig({
  test: {
    root: path.resolve(__dirname),
    include: ['src/__tests__/**/*.test.ts'],
  },
});
