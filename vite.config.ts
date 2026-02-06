import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import fs from 'fs'

// Custom plugin to handle URL-encoded filenames (especially with # characters)
function staticFilePlugin(): PluginOption {
  return {
    name: 'static-file-handler',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.includes('/images/')) {
          // Decode the URL to get the actual file path
          const decodedUrl = decodeURIComponent(req.url)
          const filePath = path.join(process.cwd(), 'public', decodedUrl)
          
          if (fs.existsSync(filePath)) {
            // Serve the file directly
            const ext = path.extname(filePath).toLowerCase()
            const contentType = ext === '.png' ? 'image/png' : 
                               ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                               ext === '.gif' ? 'image/gif' :
                               ext === '.webp' ? 'image/webp' : 'application/octet-stream'
            
            res.setHeader('Content-Type', contentType)
            res.setHeader('Cache-Control', 'public, max-age=31536000')
            fs.createReadStream(filePath).pipe(res)
            return
          }
        }
        next()
      })
    }
  }
}

export default defineConfig({
  base: './', // Use relative paths for Electron production build
  build: {
    emptyOutDir: false // Don't clear dist folder (electron-builder outputs there too)
  },
  plugins: [
    staticFilePlugin(),
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            lib: {
              entry: 'electron/main.ts',
              formats: ['cjs']
            },
            rollupOptions: {
              external: ['koffi'], // Native module - don't bundle
              output: {
                entryFileNames: '[name].js'
              }
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            lib: {
              entry: 'electron/preload.ts',
              formats: ['cjs']
            },
            rollupOptions: {
              output: {
                entryFileNames: '[name].js'
              }
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@screens': path.resolve(__dirname, './src/screens'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  }
})

