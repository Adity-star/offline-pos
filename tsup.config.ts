import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'electron/main.ts',
    'electron/preload.ts',
  ],

  outDir: 'dist-electron',

  clean: true,

  splitting: false,

  sourcemap: true,

  format: ['cjs'],

  target: 'node18',

  platform: 'node',

  external: ['electron'],
})