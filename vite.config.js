import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import glsl from 'vite-plugin-glsl';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: "/",
    clearScreen: false,
    optimizeDeps: {
        esbuildOptions: {
            supported: {
                'top-level-await': true
            }
        },
        include: ['react', 'react-dom']
    },
    esbuild: {
        supported: {
            'top-level-await': true
        }
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'jsxRuntime',
                    'react-dom/client': 'ReactDOMClient'
                }
            }
        }
    },
    server: {
        open: true
    },
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                { src: 'node_modules/three/examples/jsm/libs/ammo.wasm.js', dest: 'jsm/libs/' },
                { src: 'node_modules/three/examples/jsm/libs/ammo.wasm.wasm', dest: 'jsm/libs/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.js', dest: 'jsm/libs/draco/gltf' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm', dest: 'jsm/libs/draco/gltf/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_encoder.js', dest: 'jsm/libs/draco/gltf/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js', dest: 'jsm/libs/draco/gltf/' }
            ]
        }),
        glsl()
    ]
})
