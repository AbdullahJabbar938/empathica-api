const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

// Admin dashboard
router.get("/dashboard", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    const Reflection = require("../models/Reflection");
    
    const [users, reflections] = await Promise.all([
      User.countDocuments(),
      Reflection.countDocuments()
    ]);
    
    res.json({
      success: true,
      data: {
        totalUsers: users,
        totalReflections: reflections,
        activeToday: 0 // Would calculate active users today
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;