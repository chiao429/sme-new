import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.FRONTEND_PORT || 4173);
const app = express();
const clientDir = path.resolve(root, 'dist/client');

app.use(express.static(clientDir, { index: 'index.html' }));
app.use((_request, response) => response.sendFile(path.join(clientDir, 'index.html')));

app.listen(port, () => {
  console.log(`SME AI frontend listening on http://localhost:${port}`);
});
