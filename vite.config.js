import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import glsl from 'vite-plugin-glsl';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: "/",
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                { src: 'node_modules/three/examples/jsm/libs/ammo.wasm.js', dest: 'jsm/libs/' },
                { src: 'node_modules/three/examples/jsm/libs/ammo.wasm.wasm', dest: 'jsm/libs/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/*', dest: 'jsm/libs/draco/gltf/' }
            ]
        }),
        glsl()
    ],
    server: {
        open: true
    },
    optimizeDeps: {
        include: ['react', 'react-dom']
    },
    build: {
        sourcemap: true
    }
});