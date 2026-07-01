function errorHandler(err, req, res, next) {
  console.error('Error:', err.message || err);

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.errors || null;

  // Prisma specific errors
  if (err.code) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = `Unique constraint failed on field(s): ${err.meta?.target || 'unknown'}`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record to update or delete not found';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Foreign key constraint failed';
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = { errorHandler };
