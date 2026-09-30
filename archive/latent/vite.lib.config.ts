import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

/**
 * Library build — produces the installable `@latent/react` package in
 * `dist-lib/` (ESM + one CSS file). React is external. Type declarations
 * are emitted separately via `tsconfig.lib.json` (see the build:lib script),
 * and the fonts are copied in afterwards. The marketing-site build stays in
 * the default vite.config.ts.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-lib',
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: false,
    lib: {
      entry: r('./src/lib/index.ts'),
      formats: ['es'],
      fileName: () => 'latent.js',
      cssFileName: 'latent',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
})
