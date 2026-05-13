import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // React runtime — changes extremely rarely; gets a long-lived cache entry
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('/scheduler/')) {
            return 'vendor-react'
          }
          // CSS-in-JS — styled-components + stylis peer dep
          if (id.includes('styled-components') || id.includes('/stylis/') || id.includes('@emotion/')) {
            return 'vendor-styled'
          }
          // Supabase client — large, split so app changes don't bust this cache
          if (id.includes('@supabase/')) {
            return 'vendor-supabase'
          }
          // Remaining deps: zustand, uuid, etc.
          return 'vendor-misc'
        },
      },
    },
  },
})
