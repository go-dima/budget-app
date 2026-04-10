import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import apiRouter from './routes/index.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

// Serve static frontend in production
const __dirname = dirname(fileURLToPath(import.meta.url));
const staticPath = join(__dirname, '../../dist/public');
if (existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.get('*', (_req, res) => res.sendFile(join(staticPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Budget App server running on http://localhost:${PORT}`);
});
