const prisma = require('../config/prisma');

const checkHealth = async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'API is healthy',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'API is healthy but database connection failed',
      database: 'disconnected'
    });
  }
};

module.exports = { checkHealth };
