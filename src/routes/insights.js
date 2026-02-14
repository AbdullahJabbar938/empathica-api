const express = require("express");
const router = express.Router();

// Mock insights data (in production, this would come from database)
let insights = [];

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });
  
  try {
    // In a real app, verify JWT token here
    // For now, we'll just extract user ID from a simple token format
    const userId = token.split("_")[1]; // Simple format: "user_123456"
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
};

// Get all insights for current user
router.get("/", verifyToken, (req, res) => {
  const userInsights = insights.filter(i => i.userId === req.userId);
  
  // If no insights, create a sample one
  if (userInsights.length === 0) {
    const sampleInsight = {
      id: "insight_" + Date.now(),
      userId: req.userId,
      title: "Welcome to Empathica!",
      content: "Start writing daily reflections to track your emotional journey and receive personalized insights.",
      type: "welcome",
      date: new Date().toISOString(),
      actions: ["Write your first reflection", "Check your mood dashboard"]
    };
    insights.push(sampleInsight);
    userInsights.push(sampleInsight);
  }
  
  res.json({
    success: true,
    count: userInsights.length,
    data: userInsights
  });
});

// Generate new insight
router.post("/", verifyToken, (req, res) => {
  const { reflectionId, type, content } = req.body;
  
  const insight = {
    id: "insight_" + Date.now(),
    userId: req.userId,
    reflectionId,
    title: "New Insight Generated",
    content: content || "Based on your recent reflections, try practicing mindfulness for 5 minutes daily.",
    type: type || "general",
    date: new Date().toISOString()
  };
  
  insights.push(insight);
  
  res.status(201).json({
    success: true,
    message: "Insight generated",
    data: insight
  });
});

module.exports = router;