const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');

async function startServer() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✅ Connected to the database');

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        console.log('HTTP server closed');
        await prisma.$disconnect();
        console.log('Database connection closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
