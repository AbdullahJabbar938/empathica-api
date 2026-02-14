const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getUserStats,
  logout
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// ========================
// PUBLIC ROUTES (No authentication needed)
// ========================

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", register);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post("/login", login);

// Health check for auth service
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth service is running",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login", 
      "GET  /api/auth/me (protected)",
      "PUT  /api/auth/update (protected)",
      "PUT  /api/auth/change-password (protected)",
      "GET  /api/auth/stats (protected)",
      "POST /api/auth/logout (protected)"
    ]
  });
});

// ========================
// PROTECTED ROUTES (Authentication required)
// ========================

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get("/me", protect, getMe);

// @route   PUT /api/auth/update
// @desc    Update user profile
// @access  Private
router.put("/update", protect, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put("/change-password", protect, changePassword);

// @route   GET /api/auth/stats
// @desc    Get user statistics
// @access  Private
router.get("/stats", protect, getUserStats);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token invalidation)
// @access  Private
router.post("/logout", protect, logout);

// ========================
// ADMIN ROUTES (Optional - for future use)
// ========================

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get("/users", protect, async (req, res) => {
  // Optional: Check if user is admin
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ success: false, error: 'Not authorized' });
  // }
  
  const User = require("../models/User");
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message
    });
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete("/users/:id", protect, async (req, res) => {
  // Optional: Check if user is admin
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ success: false, error: 'Not authorized' });
  // }
  
  const User = require("../models/User");
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    // Prevent deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete your own account"
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message
    });
  }
});

// ========================
// TEST/DEMO ROUTES (For presentation)
// ========================

// Demo registration endpoint (always works for presentation)
router.post("/demo/register", (req, res) => {
  console.log("🎮 DEMO Register:", req.body);
  
  // Generate a fake but realistic response
  const demoUser = {
    _id: "demo_" + Date.now(),
    name: req.body.name || "Demo Student",
    email: req.body.email || "demo@student.edu",
    role: "student",
    avatar: "",
    bio: "",
    streak: 0,
    reflectionCount: 0,
    settings: {
      theme: "auto",
      notifications: { email: true, push: true }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  res.status(201).json({
    success: true,
    message: "Demo registration successful",
    token: "demo_jwt_token_" + Date.now(),
    data: demoUser
  });
});

// Demo login endpoint (always works for presentation)
router.post("/demo/login", (req, res) => {
  console.log("🎮 DEMO Login:", req.body);
  
  const demoUser = {
    _id: "demo_user_123",
    name: "Demo Student",
    email: req.body.email || "demo@student.edu",
    role: "student",
    avatar: "",
    bio: "This is a demo account for presentation",
    streak: 7,
    reflectionCount: 15,
    settings: {
      theme: "auto",
      notifications: { email: true, push: true }
    },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
    lastLogin: new Date()
  };
  
  res.status(200).json({
    success: true,
    message: "Demo login successful",
    token: "demo_jwt_token_" + Date.now(),
    data: demoUser
  });
});

// Quick test endpoint to verify auth routes are working
router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth routes are working!",
    availableEndpoints: [
      "POST /api/auth/register - Register new user",
      "POST /api/auth/login - Login user",
      "GET  /api/auth/me - Get current user (protected)",
      "POST /api/auth/demo/register - Demo registration (always works)",
      "POST /api/auth/demo/login - Demo login (always works)",
      "GET  /api/auth/health - Service health check"
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;