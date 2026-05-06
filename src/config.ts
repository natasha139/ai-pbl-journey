// Worker URL for production. In development, Vite proxies /api to localhost:8787.
export const WORKER_URL =
  import.meta.env.PROD
    ? 'https://ai-pbl-journey-worker.100170403natasha.workers.dev'
    : '';
