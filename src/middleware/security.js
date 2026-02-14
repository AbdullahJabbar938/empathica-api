// api/src/middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');
const csurf = require('csurf');
const hsts = require('hsts');
const nocache = require('nocache');
const crypto = require('crypto');
const requestIp = require('request-ip');

// Security middleware configuration
const securityMiddleware = (app) => {
  // Set security HTTP headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net",
          ],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://apis.google.com",
            "https://www.google-analytics.com",
            "https://cdn.jsdelivr.net",
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://cdn.jsdelivivr.net",
          ],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: [
            "'self'",
            "http://localhost:8000",
            "https://api.empathica.app",
            "https://www.google-analytics.com",
            "wss://empathica.app",
          ],
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          manifestSrc: ["'self'"],
          workerSrc: ["'self'", "blob:"],
          childSrc: ["'self'", "blob:"],
          formAction: ["'self'"],
          baseUri: ["'self'"],
          upgradeInsecureRequests:
            process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin" },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
    })
  );

  // HSTS for HTTPS
  if (process.env.NODE_ENV === 'production') {
    app.use(
      hsts({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      })
    );
  }

  // Rate limiting configuration
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
      // Use client IP + user agent for rate limiting key
      const ip = requestIp.getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      return crypto.createHash('sha256').update(ip + userAgent).digest('hex');
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000,
      });
    },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      success: false,
      error: 'Too many login attempts, please try again after 15 minutes',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
    skipSuccessfulRequests: false,
  });

  const exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
      success: false,
      error: 'Too many export requests, please try again later',
      code: 'EXPORT_RATE_LIMIT_EXCEEDED',
    },
  });

  // Apply rate limiting
  app.use('/api/', apiLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/users/export-data', exportLimiter);

  // Body parsing with limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Data sanitization against NoSQL injection
  app.use(
    mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.warn(`Sanitized NoSQL injection attempt: ${key}`, req.ip);
      },
    })
  );

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(
    hpp({
      whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price',
        'page',
        'limit',
        'sort',
      ],
    })
  );

  // CORS configuration
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://empathica.app', 'https://www.empathica.app']
      : ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token',
      'X-API-Key',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours
  };

  app.use(cors(corsOptions));

  // Compression
  app.use(
    compression({
      level: 6,
      threshold: 1024, // Compress responses larger than 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    })
  );

  // No cache for API responses
  app.use(
    nocache({
      noEtag: true, // Remove ETag headers
    })
  );

  // Request logging middleware
  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    req.requestTime = new Date().toISOString();
    
    // Log request details
    console.log(
      `${req.requestId} ${req.method} ${req.originalUrl} - ${req.ip} - ${req.headers['user-agent']}`
    );
    
    // Add security headers
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
  });

  // Request validation middleware
  app.use((req, res, next) => {
    // Validate content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(415).json({
          success: false,
          error: 'Unsupported Media Type. Use application/json',
        });
      }
    }

    // Validate request size
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 10 * 1024) { // 10KB limit
      return res.status(413).json({
        success: false,
        error: 'Request entity too large',
      });
    }

    next();
  });

  // CSRF protection (only for sessions)
  if (process.env.ENABLE_SESSIONS === 'true') {
    const csrfProtection = csurf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      },
    });
    
    app.use(csrfProtection);
    
    // Add CSRF token to response
    app.use((req, res, next) => {
      res.cookie('XSRF-TOKEN', req.csrfToken(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      next();
    });
  }

  // Security headers middleware
  app.use((req, res, next) => {
    // Additional security headers
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
    
    // Feature Policy (deprecated but still useful)
    res.setHeader('Feature-Policy', [
      "geolocation 'none'",
      "microphone 'none'",
      "camera 'none'",
      "payment 'none'",
    ].join('; '));
    
    next();
  });
};

// Security utility functions
const securityUtils = {
  // Generate secure random tokens
  generateSecureToken: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  },

  // Hash password with salt
  hashPassword: async (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex');
    return { salt, hash };
  },

  // Verify password
  verifyPassword: async (password, salt, hash) => {
    const verifyHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex');
    return verifyHash === hash;
  },

  // Encrypt sensitive data
  encryptData: (text, key) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return {
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    };
  },

  // Decrypt sensitive data
  decryptData: (encryptedData, key) => {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },

  // Validate input against common attack patterns
  validateInput: (input) => {
    const threats = [
      { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, type: 'XSS' },
      { pattern: /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi, type: 'SQL Injection' },
      { pattern: /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi, type: 'SQL Injection' },
      { pattern: /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi, type: 'SQL Injection' },
      { pattern: /((\%27)|(\'))union/gi, type: 'SQL Injection' },
      { pattern: /exec(\s|\+)+(s|x)p\w+/gi, type: 'SQL Injection' },
      { pattern: /\/\*.*\*\//gi, type: 'SQL Injection' },
      { pattern: /(\-\-)/gi, type: 'SQL Injection' },
      { pattern: /;.*$/gi, type: 'Command Injection' },
      { pattern: /\|\|/gi, type: 'Command Injection' },
      { pattern: /&&/gi, type: 'Command Injection' },
      { pattern: /`/gi, type: 'Command Injection' },
      { pattern: /\$/gi, type: 'Command Injection' },
    ];

    for (const threat of threats) {
      if (threat.pattern.test(input)) {
        return {
          valid: false,
          threat: threat.type,
          message: `Potential ${threat.type} attack detected`,
        };
      }
    }

    return { valid: true };
  },

  // Generate secure API key
  generateApiKey: () => {
    return `emp_${crypto.randomBytes(32).toString('hex')}`;
  },

  // Check password strength
  checkPasswordStrength: (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    let strength = 'weak';

    if (score === 5) strength = 'very-strong';
    else if (score === 4) strength = 'strong';
    else if (score === 3) strength = 'moderate';

    return {
      strength,
      score,
      checks,
      suggestions: !checks.length ? 'Password should be at least 8 characters' :
                   !checks.uppercase ? 'Add uppercase letters' :
                   !checks.lowercase ? 'Add lowercase letters' :
                   !checks.numbers ? 'Add numbers' :
                   !checks.special ? 'Add special characters' : null,
    };
  },
};

// Audit logging middleware
const auditLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture response data
  const originalSend = res.send;
  res.send = function (body) {
    const responseTime = Date.now() - startTime;
    
    // Log audit data
    const auditData = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user ? req.user.id : 'anonymous',
      statusCode: res.statusCode,
      responseTime,
      requestBody: req.body,
      responseSize: body ? body.length : 0,
    };

    // Log to file/database (in production)
    console.log('[AUDIT]', JSON.stringify(auditData));
    
    // Send original response
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = {
  securityMiddleware,
  securityUtils,
  auditLogger,
};
