import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    environment: 'node',
    // the Postgres integration tests share one database and truncate it
    fileParallelism: false,
    include: ['src/**/*.test.ts'],
  },
})
