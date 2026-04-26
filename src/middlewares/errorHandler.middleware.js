const AppError = require('../utils/AppError');
const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  // Log full error with stack trace for debugging
  console.error('--- ERROR ---');
  console.error(`${req.method} ${req.originalUrl}`);
  console.error('Message:', err.message);
  if (err.stack) console.error('Stack:', err.stack);
  console.error('--- END ERROR ---');

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = err.errors.map((e) => e.message);
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate field value entered';
    errors = err.errors.map((e) => e.message);
  } else if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = err.parent ? err.parent.message : 'Database error';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size must not exceed 10MB';
  }

  // Handle other multer errors
  if (err.name === 'MulterError' && !errors.length) {
    statusCode = 400;
    message = err.message;
  }

  // In production, don't leak internal error details
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  return errorResponse(res, statusCode, message, errors.length ? errors : null);
};

module.exports = errorHandler;
