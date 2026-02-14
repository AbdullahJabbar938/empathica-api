// // server.js - Main entry point for Empathica API
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const morgan = require("morgan");
// const helmet = require("helmet");
// const dotenv = require("dotenv");
// const path = require("path");

// // Load environment variables
// dotenv.config();

// // Initialize Express
// const app = express();

// // ========================
// // DATABASE CONNECTION
// // ========================
// const connectDB = async () => {
//   try {
//     const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/empathica";
    
//     console.log("ðŸ”— Connecting to MongoDB...");
//     await mongoose.connect(mongoURI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000,
//     });
    
//     console.log("âœ… MongoDB Connected Successfully");
//     console.log(`   Database: ${mongoose.connection.db.databaseName}`);
//     console.log(`   Host: ${mongoose.connection.host}`);
    
//     // Listen for connection events
//     mongoose.connection.on('error', (err) => {
//       console.error('âŒ MongoDB connection error:', err);
//     });
    
//     mongoose.connection.on('disconnected', () => {
//       console.log('âš ï¸ MongoDB disconnected');
//     });
    
//   } catch (error) {
//     console.error("âŒ MongoDB Connection Failed:", error.message);
//     console.log("âš ï¸ Running in development mode with limited functionality");
//     console.log("ðŸ’¡ To enable database features, start MongoDB with:");
//     console.log("   mongod --dbpath C:\\data\\db");
//     console.log("   OR use MongoDB Atlas and update MONGODB_URI in .env");
//   }
// };

// // ========================
// // MIDDLEWARE
// // ========================
// app.use(helmet()); // Security headers
// app.use(cors({
//   origin: ['http://localhost:3000', 'http://localhost:5000'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
// }));
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(morgan("dev")); // Logging

// // ========================
// // ROUTE IMPORTS
// // ========================
// const authRoutes = require("./src/routes/auth");
// const reflectionRoutes = require("./src/routes/reflections");
// const adminRoutes = require("./src/routes/admin");

// // ========================
// // API ROUTES
// // ========================

// // Root endpoint
// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "Empathica API - Student Mental Wellness Platform",
//     version: "1.0.0",
//     documentation: "https://github.com/yourusername/empathica",
//     endpoints: {
//       auth: {
//         register: "POST /api/auth/register",
//         login: "POST /api/auth/login",
//         profile: "GET /api/auth/me",
//         demo: {
//           register: "POST /api/auth/demo/register",
//           login: "POST /api/auth/demo/login"
//         }
//       },
//       reflections: {
//         create: "POST /api/reflections",
//         list: "GET /api/reflections",
//         stats: "GET /api/reflections/stats",
//         single: "GET /api/reflections/:id"
//       },
//       system: {
//         health: "GET /api/health",
//         info: "GET /api/info"
//       }
//     },
//     status: "operational",
//     timestamp: new Date().toISOString()
//   });
// });

// // Health check endpoint
// app.get("/api/health", (req, res) => {
//   const healthStatus = {
//     success: true,
//     status: "healthy",
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
//     memory: process.memoryUsage(),
//     services: {
//       backend: "running",
//       database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
//       ai_service: "external"
//     }
//   };
  
//   res.status(200).json(healthStatus);
// });

// // System info endpoint
// app.get("/api/info", (req, res) => {
//   res.json({
//     success: true,
//     app: {
//       name: "Empathica",
//       version: "1.0.0",
//       environment: process.env.NODE_ENV || "development",
//       node_version: process.version
//     },
//     database: {
//       connected: mongoose.connection.readyState === 1,
//       name: mongoose.connection.db?.databaseName || "N/A",
//       host: mongoose.connection.host || "N/A"
//     },
//     limits: {
//       max_body_size: "10mb",
//       rate_limiting: "enabled",
//       cors: "enabled"
//     },
//     features: {
//       authentication: true,
//       journaling: true,
//       ai_analysis: true,
//       insights: true,
//       dashboard: true
//     }
//   });
// });

// // Mount route handlers
// app.use("/api/auth", authRoutes);
// app.use("/api/reflections", reflectionRoutes);
// app.use("/api/admin", adminRoutes);

// // ========================
// // DEMO ENDPOINTS (For presentation)
// // ========================

// // Demo reflection creation (always works)
// app.post("/api/demo/reflections", (req, res) => {
//   console.log("ðŸŽ® DEMO Reflection creation:", req.body.text?.substring(0, 50) + "...");
  
//   const emotions = ["joy", "sadness", "stress", "anxiety", "neutral", "surprise"];
//   const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
  
//   const demoReflection = {
//     _id: "demo_reflection_" + Date.now(),
//     text: req.body.text || "Demo reflection text",
//     emotionLabel: randomEmotion,
//     emotionScore: Math.random().toFixed(2),
//     sentiment: ["joy", "surprise"].includes(randomEmotion) ? "positive" : 
//                ["sadness", "stress", "anxiety"].includes(randomEmotion) ? "negative" : "neutral",
//     tags: req.body.tags || ["demo"],
//     date: new Date().toISOString(),
//     user: {
//       _id: "demo_user_123",
//       name: "Demo Student"
//     },
//     analysisVersion: "v2.0-ai",
//     metadata: {
//       processingTime: 0.5,
//       analysisSource: "demo_service"
//     }
//   };
  
//   res.status(201).json({
//     success: true,
//     message: "Demo reflection created successfully",
//     data: demoReflection,
//     analysis: {
//       source: "demo_service",
//       emotion: demoReflection.emotionLabel,
//       confidence: demoReflection.emotionScore
//     }
//   });
// });

// // Demo dashboard stats (always works)
// app.get("/api/demo/stats", (req, res) => {
//   const stats = {
//     totalReflections: 24,
//     streak: 7,
//     averageEmotionScore: 0.65,
//     emotionDistribution: [
//       { emotion: "joy", count: 8, percentage: 33.3 },
//       { emotion: "neutral", count: 6, percentage: 25 },
//       { emotion: "stress", count: 5, percentage: 20.8 },
//       { emotion: "anxiety", count: 3, percentage: 12.5 },
//       { emotion: "sadness", count: 2, percentage: 8.3 }
//     ],
//     timeline: Array.from({ length: 14 }, (_, i) => {
//       const date = new Date();
//       date.setDate(date.getDate() - (13 - i));
//       return {
//         date: date.toISOString().split('T')[0],
//         avgScore: (0.4 + Math.random() * 0.4).toFixed(2),
//         count: Math.floor(Math.random() * 3) + 1
//       };
//     }),
//     mostCommonEmotion: "joy",
//     moodTrend: "improving"
//   };
  
//   res.json({
//     success: true,
//     data: stats
//   });
// });

// // Quick test endpoint
// app.get("/api/test", (req, res) => {
//   res.json({
//     success: true,
//     message: "API is working!",
//     test_data: {
//       string: "Hello World",
//       number: 42,
//       boolean: true,
//       array: [1, 2, 3],
//       object: { key: "value" }
//     },
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime()
//   });
// });

// // ========================
// // ERROR HANDLING MIDDLEWARE
// // ========================

// // 404 handler
// app.use((req, res, next) => {
//   res.status(404).json({
//     success: false,
//     error: "Endpoint not found",
//     requested_url: req.originalUrl,
//     method: req.method,
//     available_endpoints: [
//       "GET    /",
//       "GET    /api/health",
//       "GET    /api/info",
//       "GET    /api/test",
//       "POST   /api/auth/register",
//       "POST   /api/auth/login",
//       "GET    /api/auth/me",
//       "POST   /api/auth/demo/register",
//       "POST   /api/auth/demo/login",
//       "POST   /api/reflections",
//       "GET    /api/reflections",
//       "GET    /api/reflections/stats",
//       "POST   /api/demo/reflections",
//       "GET    /api/demo/stats"
//     ]
//   });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error("âŒ Global error handler:", err);
  
//   const statusCode = err.statusCode || 500;
//   const message = err.message || "Internal Server Error";
  
//   res.status(statusCode).json({
//     success: false,
//     error: message,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
//   });
// });

// // ========================
// // START SERVER
// // ========================
// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   console.log("ðŸš€ Starting Empathica API Server...");
//   console.log("=".repeat(60));
  
//   // Connect to database
//   await connectDB();
  
//   // Start server
//   const server = 
// // ========================
// // DEMO ENDPOINTS FOR WEDNESDAY PRESENTATION
// // (These ALWAYS work for demonstration)
// // ========================

// // Test endpoint - always works
// app.get("/api/test", (req, res) => {
//     res.json({
//         success: true,
//         message: "API is working!",
//         timestamp: new Date().toISOString(),
//         version: "1.0.0"
//     });
// });

// // Demo registration (always works - no database needed)
// app.post("/api/auth/demo/register", (req, res) => {
//     console.log("🎮 DEMO Register:", req.body.email);
    
//     const demoUser = {
//         _id: "demo_user_" + Date.now(),
//         name: req.body.name || "Demo Student",
//         email: req.body.email || "demo@student.edu",
//         role: "student",
//         streak: 0,
//         reflectionCount: 0,
//         lastLogin: new Date(),
//         createdAt: new Date(),
//         isDemo: true
//     };
    
//     const token = jwt.sign(
//         { userId: demoUser._id, email: demoUser.email, isDemo: true },
//         process.env.JWT_SECRET || "empathica-secret-key",
//         { expiresIn: "7d" }
//     );
    
//     res.json({
//         success: true,
//         message: "Demo registration successful",
//         token,
//         user: demoUser
//     });
// });

// // Demo login (always works - no database needed)
// app.post("/api/auth/demo/login", (req, res) => {
//     console.log("🎮 DEMO Login:", req.body.email);
    
//     const demoUser = {
//         _id: "demo_user_123",
//         name: "Presentation Demo User",
//         email: req.body.email || "demo@student.edu",
//         role: "student",
//         streak: 5,
//         reflectionCount: 12,
//         lastLogin: new Date(),
//         createdAt: new Date("2024-01-01"),
//         isDemo: true
//     };
    
//     const token = jwt.sign(
//         { userId: demoUser._id, email: demoUser.email, isDemo: true },
//         process.env.JWT_SECRET || "empathica-secret-key",
//         { expiresIn: "7d" }
//     );
    
//     res.json({
//         success: true,
//         message: "Demo login successful",
//         token,
//         user: demoUser
//     });
// });

// // Demo reflection creation
// app.post("/api/demo/reflections", (req, res) => {
//     console.log("🎮 DEMO Reflection created");
    
//     const demoReflection = {
//         _id: "demo_reflection_" + Date.now(),
//         text: req.body.text || "Today was a great day for my presentation! I feel confident and prepared.",
//         emotionLabel: "joy",
//         emotionScore: 0.92,
//         emotionAnalysis: {
//             joy: 0.92,
//             neutral: 0.05,
//             stress: 0.02,
//             sadness: 0.01
//         },
//         tags: req.body.tags || ["presentation", "excited", "confident"],
//         date: new Date().toISOString(),
//         user: "demo_user_123",
//         isDemo: true,
//         insights: [
//             "You're showing great confidence!",
//             "Preparation is key to success.",
//             "Positive mindset detected."
//         ]
//     };
    
//     res.json({
//         success: true,
//         message: "Demo reflection created successfully",
//         data: demoReflection
//     });
// });

// // Demo stats endpoint
// app.get("/api/demo/stats", (req, res) => {
//     res.json({
//         success: true,
//         data: {
//             totalReflections: 15,
//             currentStreak: 7,
//             longestStreak: 12,
//             averageEmotionScore: 0.78,
//             mostCommonEmotion: "joy",
//             reflectionFrequency: {
//                 daily: 5,
//                 weekly: 15,
//                 monthly: 45
//             },
//             emotionDistribution: [
//                 { emotion: "joy", count: 8, percentage: 53 },
//                 { emotion: "neutral", count: 4, percentage: 27 },
//                 { emotion: "stress", count: 2, percentage: 13 },
//                 { emotion: "sadness", count: 1, percentage: 7 }
//             ],
//             recentActivity: [
//                 { date: "2024-02-01", count: 2 },
//                 { date: "2024-01-31", count: 1 },
//                 { date: "2024-01-30", count: 3 },
//                 { date: "2024-01-29", count: 2 },
//                 { date: "2024-01-28", count: 1 }
//             ]
//         }
//     });
// });

// // Demo insights endpoint
// app.get("/api/demo/insights", (req, res) => {
//     res.json({
//         success: true,
//         data: {
//             overallMood: "positive",
//             keyInsights: [
//                 "Your mood has been consistently positive for the past week",
//                 "You write most reflections in the evening",
//                 "Academic-related reflections show higher stress levels",
//                 "Weekend reflections are more joyful"
//             ],
//             recommendations: [
//                 "Try writing morning reflections to start your day positively",
//                 "Consider meditation for academic stress",
//                 "Your consistency is excellent - keep it up!"
//             ],
//             patterns: [
//                 "Productivity peaks on Tuesday and Wednesday",
//                 "Emotional awareness improves with regular journaling",
//                 "Social activities correlate with higher joy scores"
//             ]
//         }
//     });
// });

// // Demo resources endpoint
// app.get("/api/demo/resources", (req, res) => {
//     res.json({
//         success: true,
//         data: [
//             {
//                 id: "1",
//                 title: "Managing Presentation Anxiety",
//                 type: "article",
//                 url: "https://example.com/anxiety-tips",
//                 description: "Tips for managing anxiety before presentations",
//                 tags: ["presentation", "anxiety", "academic"]
//             },
//             {
//                 id: "2",
//                 title: "Mindfulness Meditation Guide",
//                 type: "video",
//                 url: "https://example.com/meditation",
//                 description: "10-minute guided meditation for students",
//                 tags: ["meditation", "mindfulness", "stress-relief"]
//             },
//             {
//                 id: "3",
//                 title: "Study Planning Template",
//                 type: "template",
//                 url: "https://example.com/study-plan",
//                 description: "Weekly study planning template",
//                 tags: ["academic", "planning", "productivity"]
//             }
//         ]
//     });
// });

// // Root endpoint with demo info
// app.get("/", (req, res) => {
//     res.json({
//         message: "🎯 Empathica API - Ready for Wednesday Presentation!",
//         status: "operational",
//         version: "1.0.0",
//         timestamp: new Date().toISOString(),
//         endpoints: {
//             demo: {
//                 "GET /api/test": "Test if API is working",
//                 "POST /api/auth/demo/register": "Demo registration (always works)",
//                 "POST /api/auth/demo/login": "Demo login (always works)",
//                 "POST /api/demo/reflections": "Create demo reflection",
//                 "GET /api/demo/stats": "Get demo statistics",
//                 "GET /api/demo/insights": "Get demo insights",
//                 "GET /api/demo/resources": "Get demo resources"
//             },
//             production: {
//                 "GET /api/health": "Health check",
//                 "POST /api/auth/register": "Real registration",
//                 "POST /api/auth/login": "Real login",
//                 "GET /api/reflections": "Get reflections",
//                 "GET /api/insights": "Get insights",
//                 "GET /api/resources": "Get resources"
//             }
//         },
//         demoCredentials: {
//             email: "demo@student.edu",
//             password: "Demo123!"
//         }
//     });
// });

// app.listen(PORT, () => {
//     console.log(`
// âœ… SERVER STARTED SUCCESSFULLY
// ============================================================
// ðŸ“¡ Server running on: http://localhost:${PORT}
// ðŸ“ Environment: ${process.env.NODE_ENV || 'development'}
// ðŸ—„ï¸  Database: ${mongoose.connection.readyState === 1 ? 'âœ… Connected' : 'âŒ Disconnected'}
// ðŸ” Authentication: âœ… Enabled
// ðŸ¤– AI Integration: âœ… Enabled
// ðŸ“Š Dashboard: âœ… Enabled
// ============================================================

// ðŸ“‹ CRITICAL ENDPOINTS FOR PRESENTATION:
//    DEMO Endpoints (Always Work):
//    â€¢ POST /api/auth/demo/register  - Demo registration
//    â€¢ POST /api/auth/demo/login     - Demo login
//    â€¢ POST /api/demo/reflections    - Demo reflection creation
//    â€¢ GET  /api/demo/stats          - Demo dashboard stats
   
//    REAL Endpoints (Require MongoDB):
//    â€¢ POST /api/auth/register       - Real registration
//    â€¢ POST /api/auth/login          - Real login
//    â€¢ POST /api/reflections         - Real reflection creation

// ðŸ‘¤ DEMO CREDENTIALS:
//    Email: demo@student.edu
//    Password: Demo123!

// ðŸ”§ TROUBLESHOOTING:
//    If real endpoints fail:
//    1. Check MongoDB: mongosh â†’ use empathica â†’ db.users.find()
//    2. Restart MongoDB: net start MongoDB
//    3. Check .env: MONGODB_URI=mongodb://localhost:27017/empathica

// ðŸ’¡ QUICK TEST:
//    curl http://localhost:${PORT}/api/health
//    curl http://localhost:${PORT}/api/test
// ============================================================
//     `);
//   });
  
//   // Graceful shutdown
//   process.on('SIGTERM', () => {
//     console.log('SIGTERM received. Shutting down gracefully...');
//     server.close(() => {
//       console.log('Server closed.');
//       mongoose.connection.close(false, () => {
//         console.log('MongoDB connection closed.');
//         process.exit(0);
//       });
//     });
//   });
// };

// // Handle uncaught exceptions
// process.on('uncaughtException', (error) => {
//   console.error('âŒ Uncaught Exception:', error);
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('âŒ Unhandled Rejection at:', promise, 'reason:', reason);
// });

// // Start the server
// startServer().catch(error => {
//   console.error("âŒ Failed to start server:", error);
//   process.exit(1);
// });


// api/src/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const reflectionRoutes = require('./routes/reflections');

// Initialize express
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/empathica', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  console.log('⚠️ Running in demo mode without database...');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reflections', reflectionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Empathica API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Demo endpoint
app.get('/api/demo', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Empathica Demo API',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        getMe: 'GET /api/auth/me',
        demoLogin: 'POST /api/auth/demo/login'
      },
      reflections: {
        create: 'POST /api/reflections',
        getAll: 'GET /api/reflections',
        getStats: 'GET /api/reflections/stats'
      }
    },
    demoCredentials: {
      email: 'demo@student.edu',
      password: 'DemoSudent123!'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎮 Demo info: http://localhost:${PORT}/api/demo`);
});