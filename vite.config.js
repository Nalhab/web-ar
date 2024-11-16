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
        include: [
            'three',
            'tslib',
            'shallowequal',
            'stylis',
            '@emotion/is-prop-valid',
            '@fortawesome/fontawesome-svg-core',
            '@fortawesome/free-solid-svg-icons',
            '@fortawesome/react-fontawesome',
            'react',
            'react-dom'
        ]
    },
    esbuild: {
        supported: {
            'top-level-await': true
        }
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'jsxRuntime'
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
    ],
    resolve: {
        alias: {
            'three': 'three',
            'tslib': 'tslib',
            'shallowequal': 'shallowequal',
            'stylis': 'stylis',
            '@emotion/is-prop-valid': '@emotion/is-prop-valid',
            '@fortawesome/fontawesome-svg-core': '@fortawesome/fontawesome-svg-core',
            '@fortawesome/free-solid-svg-icons': '@fortawesome/free-solid-svg-icons',
            '@fortawesome/react-fontawesome': '@fortawesome/react-fontawesome'
        }
    },
})
