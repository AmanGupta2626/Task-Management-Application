import 'dotenv/config';
import http from 'http';

import { createApp } from './src/app.js';
import { connectDB } from './src/config/db.js';
import { initSocket } from './src/socket.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB(process.env.MONGO_URI);

    const app = createApp();
    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
