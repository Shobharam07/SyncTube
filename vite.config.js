import { defineConfig } from 'vite';
export default defineConfig({ server: { proxy: { '/socket.io': { target: 'http://localhost:5000', ws: true }, '/api': { target: 'http://localhost:5000' } } } });
