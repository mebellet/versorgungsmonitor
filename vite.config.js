import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { behandleApi } from './server/api.js';

// Hängt die API in den Dev-Server, damit `npm run dev` als einziger Befehl reicht.
const apiImDevServer = {
  name: 'versorgungsmonitor-api',
  configureServer(server) {
    server.middlewares.use((req, res, weiter) => {
      behandleApi(req, res).then((erledigt) => { if (!erledigt) weiter(); }).catch(weiter);
    });
  },
};

export default defineConfig({
  plugins: [react(), apiImDevServer],
});
