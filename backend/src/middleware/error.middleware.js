const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma Validation Error
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Database validation error',
      error: err.message,
    });
  }

  // Prisma Known Request Error
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Unique constraint failed',
      error: `Duplicate field: ${err.meta?.target}`,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
