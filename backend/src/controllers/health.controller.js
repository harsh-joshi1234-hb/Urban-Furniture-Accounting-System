const prisma = require('../config/prisma');
const emailService = require('../services/email.service');

const checkHealth = async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'API is healthy',
      database: 'connected',
      // Whether outbound email can be sent. No credentials are exposed.
      email: emailService.isConfigured() ? 'configured' : 'not configured'
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
