// api/src/middleware/errorHandler.js
const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

// Operational errors (expected errors)
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Enhanced error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  err.code = err.code || 'INTERNAL_ERROR';
  err.timestamp = err.timestamp || new Date().toISOString();
  err.requestId = req.requestId;
  err.path = req.originalUrl;
  err.method = req.method;
  err.ip = req.ip;

  // Log the error
  if (err.statusCode >= 500) {
    logger.error('Server Error:', {
      error: err.message,
      stack: err.stack,
      code: err.code,
      requestId: err.requestId,
      path: err.path,
      method: err.method,
      ip: err.ip,
      userId: req.user ? req.user.id : 'anonymous',
      timestamp: err.timestamp,
    });
  } else if (err.statusCode >= 400) {
    logger.warn('Client Error:', {
      error: err.message,
      code: err.code,
      requestId: err.requestId,
      path: err.path,
      method: err.method,
      ip: err.ip,
      userId: req.user ? req.user.id : 'anonymous',
      timestamp: err.timestamp,
    });
  }

  // Handle MongoDB errors
  if (err.name === 'CastError') {
    err = new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'INVALID_INPUT');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new ConflictError(`${field} already exists`);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => ({
      field: el.path,
      message: el.message,
    }));
    err = new ValidationError('Validation failed', errors);
  }

  if (err.name === 'JsonWebTokenError') {
    err = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    err = new AuthenticationError('Token expired');
  }

  // Handle production vs development error responses
  if (process.env.NODE_ENV === 'production') {
    // Production: Send minimal error information
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        timestamp: err.timestamp,
        requestId: err.requestId,
        ...(err.details && { details: err.details }),
      });
    } else {
      // Programming or unknown errors: don't leak details
      console.error('💥 Programming Error:', err);
      res.status(500).json({
        success: false,
        error: 'Something went wrong',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: err.timestamp,
        requestId: err.requestId,
      });
    }
  } else {
    // Development: Send full error details
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      stack: err.stack,
      details: err.details,
      timestamp: err.timestamp,
      requestId: err.requestId,
      path: err.path,
      method: err.method,
      ...(err.errors && { errors: err.errors }),
    });
  }
};

// 404 handler middleware
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`);
  next(error);
};

// Async error wrapper (eliminates try-catch blocks)
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  return (signal) => {
    console.log(`\n📴 ${signal} received. Starting graceful shutdown...`);
    
    // Stop new connections
    server.close(() => {
      console.log('✅ Server closed');
      
      // Close database connections
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  notFoundHandler,
  catchAsync,
  gracefulShutdown,
};
