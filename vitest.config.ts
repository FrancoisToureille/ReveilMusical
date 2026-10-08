import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/composition/container.ts'],
      thresholds: { statements: 70, branches: 60, functions: 50, lines: 70 },
    },
  },
});
