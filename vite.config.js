import { defineConfig } from 'vite';
import { resolve } from 'path';
import path from 'path';

export default defineConfig({
    base: './',
    resolve: {
        alias: {
            'howler': path.resolve(__dirname, 'node_modules/howler'),
            'dopaminejs': path.resolve(__dirname, 'node_modules/dopaminejs'),
            'dopaminejs-plugin-webgl-particles': path.resolve(__dirname, 'node_modules/dopaminejs-plugin-webgl-particles'),
            'dopaminejs-plugin-debug-overlay': path.resolve(__dirname, 'node_modules/dopaminejs-plugin-debug-overlay'),
            'dopaminejs-plugin-sound-packs': path.resolve(__dirname, 'node_modules/dopaminejs-plugin-sound-packs'),
            'dopaminejs-plugin-ecosystem': path.resolve(__dirname, 'node_modules/dopaminejs-plugin-ecosystem'),
            'dopaminejs-plugin-howler-audio': path.resolve(__dirname, 'node_modules/dopaminejs-plugin-howler-audio'),
            'dopaminejs-plugin-feedback-effects': path.resolve(__dirname, 'node_modules/dopaminejs-plugin-feedback-effects'),
            'dopaminejs-themes': path.resolve(__dirname, 'node_modules/dopaminejs-themes')
        }
    },
    optimizeDeps: {
        include: [
            'howler',
            'dopaminejs',
            'dopaminejs-plugin-webgl-particles',
            'dopaminejs-plugin-debug-overlay',
            'dopaminejs-plugin-sound-packs',
            'dopaminejs-plugin-ecosystem',
            'dopaminejs-plugin-howler-audio',
            'dopaminejs-plugin-feedback-effects',
            'dopaminejs-themes'
        ]
    },
    server: {
        port: 5173,
        fs: {
            allow: ['..']
        }
    }
});
