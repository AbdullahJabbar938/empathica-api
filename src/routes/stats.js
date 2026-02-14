const express = require("express");
const router = express.Router();

// Mock data (in production, this would come from database)
let reflections = [];

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });
  
  try {
    // Simple token parsing for mock data
    const userId = token.split("_")[1];
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
};

// Get dashboard statistics
router.get("/", verifyToken, (req, res) => {
  const userReflections = reflections.filter(r => r.userId === req.userId);
  
  // Emotion distribution
  const emotionCounts = {};
  userReflections.forEach(r => {
    emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
  });
  
  // Tag distribution
  const tagCounts = {};
  userReflections.forEach(r => {
    r.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  // Timeline data (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const timeline = userReflections
    .filter(r => new Date(r.date) > sevenDaysAgo)
    .map(r => ({
      date: r.date.split("T")[0],
      emotion: r.emotion,
      score: r.emotion === "joy" ? 0.8 : 
             r.emotion === "sadness" ? 0.3 :
             r.emotion === "stress" ? 0.4 :
             r.emotion === "anxiety" ? 0.3 :
             r.emotion === "anger" ? 0.3 : 0.5
    }));
  
  // Calculate streak
  const streak = calculateStreak(userReflections);
  
  res.json({
    success: true,
    data: {
      totalReflections: userReflections.length,
      emotionDistribution: Object.entries(emotionCounts).map(([emotion, count]) => ({
        emotion,
        count,
        percentage: userReflections.length > 0 ? 
          ((count / userReflections.length) * 100).toFixed(1) + "%" : "0%"
      })),
      tagDistribution: Object.entries(tagCounts).map(([tag, count]) => ({
        tag,
        count,
        percentage: userReflections.length > 0 ? 
          ((count / userReflections.length) * 100).toFixed(1) + "%" : "0%"
      })),
      timeline,
      streak,
      averageMoodScore: userReflections.length > 0 ? 
        parseFloat((userReflections.reduce((sum, r) => {
          const score = r.emotion === "joy" ? 0.8 : 
                       r.emotion === "sadness" ? 0.3 :
                       r.emotion === "stress" ? 0.4 :
                       r.emotion === "anxiety" ? 0.3 :
                       r.emotion === "anger" ? 0.3 : 0.5;
          return sum + score;
        }, 0) / userReflections.length).toFixed(2)) : 0,
      insights: {
        mostCommonEmotion: Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "none",
        reflectionFrequency: userReflections.length > 0 ? 
          (userReflections.length / 30).toFixed(1) + " per day (30-day avg)" : "0 per day"
      }
    }
  });
});

// Helper function to calculate streak
function calculateStreak(reflections) {
  if (reflections.length === 0) return 0;
  
  // Get unique dates sorted newest first
  const dates = [...new Set(reflections.map(r => r.date.split("T")[0]))]
    .sort()
    .reverse();
  
  let streak = 1;
  let currentDate = new Date(dates[0]);
  
  for (let i = 1; i < dates.length; i++) {
    const nextDate = new Date(dates[i]);
    const diffDays = Math.floor((currentDate - nextDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
      currentDate = nextDate;
    } else {
      break;
    }
  }
  
  return streak;
}

module.exports = router;