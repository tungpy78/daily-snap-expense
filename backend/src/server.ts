import app from './app';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] DailySnap Expense API is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

// Handle server startup errors (e.g. port already in use)
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Error] Port ${PORT} is already in use. Please change the PORT in your .env file.`);
    process.exit(1);
  } else {
    console.error('[Error] Server failed to start:', err.message);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
    process.exit(0);
  });
});
