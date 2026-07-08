require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`🔧 FixItNow API running on http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use on ${HOST}. Set a different PORT in .env or stop the process using it.`);
    process.exit(1);
  }

  if (err.code === 'EPERM') {
    console.error(`Permission denied while binding to ${HOST}:${PORT}. Try a different HOST or PORT.`);
    process.exit(1);
  }

  throw err;
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

export {};
