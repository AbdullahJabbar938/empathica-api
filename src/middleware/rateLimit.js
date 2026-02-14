// api/src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const { securityUtils } = require('./security');

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Rate limiting store with Redis
const createRedisStore = () => {
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:empathica:',
  });
};

// General API rate limiter
const apiLimiter = rateLimit({
  store: createRedisStore(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits for authenticated vs anonymous users
    if (req.user) {
      return 200; // 200 requests per 15 minutes for authenticated users
    }
    return 100; // 100 requests per 15 minutes for anonymous users
  },
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Generate key based on IP and user ID if authenticated
    const ip = req.ip;
    const userId = req.user ? req.user.id : 'anonymous';
    return `${ip}:${userId}`;
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      error: options.message.error,
      code: options.message.code,
      retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000,
      timestamp: new Date().toISOString(),
    });
  },
});

// Authentication rate limiter (stricter)
const authLimiter = rateLimit({
  store: createRedisStore(),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Key based on IP and email to prevent brute force
    const ip = req.ip;
    const email = req.body.email || 'unknown';
    return `auth:${ip}:${email}`;
  },
});

// Export data rate limiter
const exportLimiter = rateLimit({
  store: createRedisStore(),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 exports per hour
  message: {
    success: false,
    error: 'Too many export requests, please try again later',
    code: 'EXPORT_RATE_LIMIT_EXCEEDED',
  },
});

// AI service rate limiter
const aiServiceLimiter = rateLimit({
  store: createRedisStore(),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'AI service rate limit exceeded',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
});

// Dynamic rate limiting based on user behavior
const dynamicLimiter = (req, res, next) => {
  const userKey = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  
  // Check user's request history
  redisClient.hgetall(`behavior:${userKey}`, (err, data) => {
    if (err) return next();
    
    const now = Date.now();
    const requestCount = parseInt(data?.requestCount || 0);
    const lastRequest = parseInt(data?.lastRequest || 0);
    const suspiciousScore = parseInt(data?.suspiciousScore || 0);
    
    // Calculate time since last request
    const timeSinceLastRequest = now - lastRequest;
    
    // Detect rapid fire requests (potential attack)
    if (timeSinceLastRequest < 100) { // Less than 100ms between requests
      redisClient.hincrby(`behavior:${userKey}`, 'suspiciousScore', 1);
      
      if (suspiciousScore + 1 > 10) {
        // Block user for 5 minutes
        redisClient.setex(`blocked:${userKey}`, 300, 'true');
        return res.status(429).json({
          success: false,
          error: 'Suspicious activity detected. Access temporarily blocked.',
          code: 'SUSPICIOUS_ACTIVITY',
        });
      }
    }
    
    // Update behavior tracking
    redisClient.hmset(`behavior:${userKey}`, {
      requestCount: requestCount + 1,
      lastRequest: now,
      suspiciousScore: Math.max(0, suspiciousScore - 0.1), // Decay suspicious score
      lastUpdated: now,
    });
    
    // Set expiry for behavior data (24 hours)
    redisClient.expire(`behavior:${userKey}`, 86400);
    
    next();
  });
};

// Check if user is blocked
const checkBlocked = (req, res, next) => {
  const userKey = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  
  redisClient.get(`blocked:${userKey}`, (err, blocked) => {
    if (err) return next();
    
    if (blocked) {
      return res.status(403).json({
        success: false,
        error: 'Access blocked due to suspicious activity',
        code: 'ACCESS_BLOCKED',
      });
    }
    
    next();
  });
};

// IP reputation system
const ipReputation = {
  trackRequest: (ip, path, statusCode) => {
    const key = `reputation:${ip}`;
    const now = Date.now();
    
    // Track failed requests (status >= 400)
    if (statusCode >= 400) {
      redisClient.zadd(`failed:${ip}`, now, `${now}:${path}:${statusCode}`);
      redisClient.expire(`failed:${ip}`, 3600); // Keep for 1 hour
      
      // Count recent failures
      redisClient.zcount(`failed:${ip}`, now - 3600000, now, (err, count) => {
        if (count > 50) { // More than 50 failures in 1 hour
          redisClient.setex(`reputation:bad:${ip}`, 7200, 'true'); // Mark as bad for 2 hours
        }
      });
    }
    
    // Increment total request count
    redisClient.hincrby(key, 'totalRequests', 1);
    
    // Update last request time
    redisClient.hset(key, 'lastRequest', now);
    
    // Set expiry
    redisClient.expire(key, 86400); // 24 hours
  },
  
  getReputation: async (ip) => {
    const key = `reputation:${ip}`;
    const data = await redisClient.hgetall(key);
    
    const totalRequests = parseInt(data?.totalRequests || 0);
    const lastRequest = parseInt(data?.lastRequest || 0);
    const now = Date.now();
    
    // Check if IP is marked as bad
    const isBad = await redisClient.get(`reputation:bad:${ip}`);
    
    return {
      totalRequests,
      lastSeen: lastRequest ? new Date(lastRequest) : null,
      isBad: !!isBad,
      score: isBad ? 0 : Math.min(100, totalRequests * 0.1), // Simple scoring
    };
  },
  
  resetReputation: (ip) => {
    redisClient.del(`reputation:${ip}`);
    redisClient.del(`reputation:bad:${ip}`);
    redisClient.del(`failed:${ip}`);
  },
};

// Abuse detection middleware
const abuseDetection = (req, res, next) => {
  // Skip for certain paths
  const skipPaths = ['/health', '/metrics', '/docs'];
  if (skipPaths.includes(req.path)) return next();
  
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const path = req.path;
  
  // Check for common attack patterns
  const patterns = [
    { pattern: /\.\.\//g, type: 'Path Traversal' },
    { pattern: /<script>/gi, type: 'XSS Attempt' },
    { pattern: /union.*select/gi, type: 'SQL Injection' },
    { pattern: /exec.*\(/gi, type: 'Command Injection' },
    { pattern: /\.(php|asp|aspx|jsp)/gi, type: 'File Inclusion' },
  ];
  
  // Check URL
  const url = req.originalUrl.toLowerCase();
  for (const { pattern, type } of patterns) {
    if (pattern.test(url)) {
      logger.warn(`Abuse detected: ${type}`, {
        ip,
        userAgent,
        url: req.originalUrl,
        type,
      });
      
      // Track in Redis
      redisClient.incr(`abuse:${type}:${ip}`);
      redisClient.expire(`abuse:${type}:${ip}`, 3600);
      
      // Block if too many attempts
      redisClient.get(`abuse:${type}:${ip}`, (err, count) => {
        if (count > 5) {
          redisClient.setex(`blocked:${ip}`, 3600, 'true'); // Block for 1 hour
        }
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        code: 'INVALID_REQUEST',
      });
    }
  }
  
  // Track request for reputation
  res.on('finish', () => {
    ipReputation.trackRequest(ip, path, res.statusCode);
  });
  
  next();
};

// Rate limit based on reputation
const reputationBasedLimiter = async (req, res, next) => {
  const ip = req.ip;
  const reputation = await ipReputation.getReputation(ip);
  
  // Adjust rate limit based on reputation
  if (reputation.isBad) {
    req.rateLimit = {
      windowMs: 60 * 1000, // 1 minute
      max: 5, // Very restrictive for bad reputation
    };
  } else if (reputation.score < 50) {
    req.rateLimit = {
      windowMs: 15 * 60 * 1000,
      max: 50, // Restrictive for low reputation
    };
  } else {
    req.rateLimit = {
      windowMs: 15 * 60 * 1000,
      max: 200, // Normal for good reputation
    };
  }
  
  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  exportLimiter,
  aiServiceLimiter,
  dynamicLimiter,
  checkBlocked,
  ipReputation,
  abuseDetection,
  reputationBasedLimiter,
  redisClient,
};
