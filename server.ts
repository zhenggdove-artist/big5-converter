import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route to fetch the Big5 table
  app.get('/api/big5-table', async (req, res) => {
    try {
      const response = await fetch('https://moztw.org/docs/big5/table/cp950-u2b.txt');
      if (!response.ok) {
        throw new Error(`Failed to fetch table: ${response.statusText}`);
      }
      const text = await response.text();
      res.setHeader('Content-Type', 'text/plain');
      res.send(text);
    } catch (error) {
      console.error('Error fetching Big5 table:', error);
      res.status(500).json({ error: 'Failed to fetch Big5 table' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
