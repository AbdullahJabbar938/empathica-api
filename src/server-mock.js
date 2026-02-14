const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const PORT = 5000;

app.use(express.json());

// Mock database
const users = [];
const reflections = [];
const insights = [];

// ========================
// MIDDLEWARE
// ========================
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token" });
  
  try {
    const decoded = jwt.verify(token, "test-secret");
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
};

// ========================
// ROUTES
// ========================

// 1. HEALTH
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "Empathica API v1.0",
    timestamp: new Date().toISOString(),
    stats: {
      users: users.length,
      reflections: reflections.length,
      insights: insights.length
    }
  });
});

// 2. AUTHENTICATION
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ success: false, error: "Email already registered" });
  }
  
  const user = { 
    id: Date.now().toString(), 
    name, 
    email, 
    role: "student",
    preferences: { theme: "light", notifications: true }
  };
  
  users.push({ ...user, password });
  
  const token = jwt.sign({ id: user.id }, "test-secret", { expiresIn: "7d" });
  
  res.json({ 
    success: true, 
    token, 
    user 
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const userData = users.find(u => u.email === email && u.password === password);
  
  if (!userData) {
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }
  
  const { password: _, ...user } = userData;
  const token = jwt.sign({ id: user.id }, "test-secret", { expiresIn: "7d" });
  
  res.json({ success: true, token, user });
});

app.get("/api/auth/me", verifyToken, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ success: false, error: "User not found" });
  
  const { password: _, ...userResponse } = user;
  res.json({ success: true, user: userResponse });
});

// 3. REFLECTIONS (JOURNAL)
app.post("/api/reflections", verifyToken, (req, res) => {
  const { text, tags } = req.body;
  
  // AI Emotion Analysis
  const textLower = text.toLowerCase();
  let emotionLabel = "neutral";
  let emotionScore = 0.5;
  
  const emotionRules = {
    "joy": ["happy", "good", "great", "excited", "joy", "love", "proud", "amazing"],
    "sadness": ["sad", "bad", "unhappy", "depressed", "alone", "lonely"],
    "anger": ["angry", "mad", "furious", "annoyed", "upset"],
    "stress": ["stress", "pressure", "overwhelmed", "busy", "deadline"],
    "anxiety": ["anxious", "worried", "nervous", "scared", "fear"]
  };
  
  for (const [emotion, words] of Object.entries(emotionRules)) {
    if (words.some(word => textLower.includes(word))) {
      emotionLabel = emotion;
      emotionScore = emotion === "joy" ? 0.8 : 0.3;
      break;
    }
  }
  
  const reflection = {
    id: Date.now().toString(),
    userId: req.userId,
    text,
    emotionLabel,
    emotionScore,
    sentiment: emotionScore > 0.6 ? "positive" : emotionScore < 0.4 ? "negative" : "neutral",
    tags: tags || [],
    date: new Date().toISOString(),
    wordCount: text.split(/\s+/).length,
    confidence: 0.85
  };
  
  reflections.push(reflection);
  
  // Generate insight
  if (reflections.filter(r => r.userId === req.userId).length % 3 === 0) {
    const insight = {
      id: Date.now().toString(),
      userId: req.userId,
      reflectionId: reflection.id,
      type: "pattern",
      title: "Emotion Pattern Detected",
      content: `You've been writing about ${emotionLabel} recently. Consider taking a break or trying relaxation techniques.`,
      generatedAt: new Date().toISOString()
    };
    insights.push(insight);
  }
  
  res.status(201).json({ success: true, data: reflection });
});

app.get("/api/reflections", verifyToken, (req, res) => {
  const userReflections = reflections.filter(r => r.userId === req.userId);
  res.json({ success: true, data: userReflections });
});

app.get("/api/reflections/:id", verifyToken, (req, res) => {
  const reflection = reflections.find(r => r.id === req.params.id && r.userId === req.userId);
  if (!reflection) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, data: reflection });
});

// 4. DASHBOARD STATISTICS - THIS IS THE MISSING ENDPOINT
app.get("/api/reflections/stats", verifyToken, (req, res) => {
  const userReflections = reflections.filter(r => r.userId === req.userId);
  
  // Emotion distribution
  const emotionCounts = {};
  userReflections.forEach(r => {
    emotionCounts[r.emotionLabel] = (emotionCounts[r.emotionLabel] || 0) + 1;
  });
  
  // Timeline (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const timeline = userReflections
    .filter(r => new Date(r.date) > thirtyDaysAgo)
    .map(r => ({
      date: r.date.split("T")[0],
      score: r.emotionScore
    }));
  
  // Tag distribution
  const tagCounts = {};
  userReflections.forEach(r => {
    r.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  res.json({
    success: true,
    data: {
      totalReflections: userReflections.length,
      emotionDistribution: Object.entries(emotionCounts).map(([emotion, count]) => ({
        emotion,
        count,
        percentage: userReflections.length > 0 ? ((count / userReflections.length) * 100).toFixed(1) + "%" : "0%"
      })),
      timeline,
      tagDistribution: Object.entries(tagCounts).map(([tag, count]) => ({ tag, count })),
      streak: calculateStreak(userReflections),
      averageEmotionScore: userReflections.length > 0 ? 
        userReflections.reduce((sum, r) => sum + r.emotionScore, 0) / userReflections.length : 0
    }
  });
});

// 5. INSIGHTS
app.get("/api/insights", verifyToken, (req, res) => {
  const userInsights = insights.filter(i => i.userId === req.userId);
  res.json({ success: true, data: userInsights });
});

// 6. USER PROFILE
app.put("/api/users/profile", verifyToken, (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.userId);
  if (userIndex === -1) return res.status(404).json({ success: false, error: "User not found" });
  
  const { name, preferences } = req.body;
  if (name) users[userIndex].name = name;
  if (preferences) users[userIndex].preferences = { ...users[userIndex].preferences, ...preferences };
  
  const { password: _, ...userResponse } = users[userIndex];
  res.json({ success: true, user: userResponse });
});

// 7. RESOURCES
app.get("/api/resources", (req, res) => {
  const resources = [
    {
      id: "1",
      type: "crisis",
      title: "Crisis Support",
      description: "Immediate help when you need it most",
      contacts: [
        { name: "National Suicide Prevention", phone: "988", website: "988lifeline.org" },
        { name: "Crisis Text Line", text: "HOME to 741741", website: "crisistextline.org" }
      ]
    },
    {
      id: "2", 
      type: "university",
      title: "University Counseling",
      description: "Your campus mental health services",
      contacts: [
        { name: "Student Counseling Center", phone: "(555) 123-4567", email: "counseling@university.edu" },
        { name: "Health Services", phone: "(555) 987-6543", website: "health.university.edu" }
      ]
    },
    {
      id: "3",
      type: "self_help",
      title: "Self-Help Resources",
      description: "Tools and techniques for self-care",
      links: [
        { name: "Mindfulness Exercises", url: "https://www.mindful.org/meditation/mindfulness-getting-started/" },
        { name: "CBT Techniques", url: "https://www.psychologytools.com/self-help/" }
      ]
    }
  ];
  
  res.json({ success: true, data: resources });
});

// Helper function for streak calculation
function calculateStreak(reflections) {
  if (reflections.length === 0) return 0;
  
  // Get unique dates sorted newest first
  const dates = [...new Set(reflections.map(r => r.date.split("T")[0]))].sort().reverse();
  let streak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const currentDate = new Date(dates[i]);
    const prevDate = new Date(dates[i - 1]);
    const diffDays = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Start server
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log("🚀 EMPATHICA API - COMPLETE VERSION");
  console.log("=".repeat(60));
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`📚 ALL ENDPOINTS AVAILABLE:`);
  console.log("   GET    /api/health");
  console.log("   POST   /api/auth/register");
  console.log("   POST   /api/auth/login");
  console.log("   GET    /api/auth/me");
  console.log("   POST   /api/reflections");
  console.log("   GET    /api/reflections");
  console.log("   GET    /api/reflections/stats  ← DASHBOARD STATS");
  console.log("   GET    /api/insights");
  console.log("   GET    /api/resources");
  console.log("   PUT    /api/users/profile");
  console.log("=".repeat(60));
  console.log("🎯 All 10 endpoints implemented");
  console.log("=".repeat(60));
});
