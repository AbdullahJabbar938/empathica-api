const Reflection = require("../models/Reflection");

// @desc    Get AI-generated insights
// @route   GET /api/insights
// @access  Private
exports.getInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's reflections
    const reflections = await Reflection.find({ user: userId })
      .sort({ date: -1 })
      .limit(50);
    
    if (reflections.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          insights: [
            {
              title: "Start Your Journey",
              message: "Welcome to Empathica! Start by writing your first reflection to get personalized insights.",
              type: "welcome",
              emotion: "neutral",
              priority: "low"
            }
          ],
          summary: "No reflections yet. Start journaling to unlock insights!"
        }
      });
    }
    
    // Calculate insights
    const totalReflections = reflections.length;
    const emotionCounts = {};
    const tagCounts = {};
    
    reflections.forEach(r => {
      const emotion = r.emotionLabel || 'neutral';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      
      (r.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    // Find dominant emotion
    let dominantEmotion = "neutral";
    let maxCount = 0;
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion;
      }
    });
    
    // Generate insights
    const insights = [];
    
    // Emotion insight
    if (dominantEmotion !== "neutral") {
      insights.push({
        title: "Emotional Pattern",
        message: \You frequently experience \. \\,
        type: "emotion",
        emotion: dominantEmotion,
        priority: dominantEmotion === "stress" ? "high" : "medium"
      });
    }
    
    // Frequency insight
    if (totalReflections >= 5) {
      insights.push({
        title: "Journaling Consistency",
        message: \You've written \ reflections. \\,
        type: "frequency",
        emotion: "neutral",
        priority: "medium"
      });
    }
    
    // Tag insight
    const frequentTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
    
    if (frequentTags.length > 0) {
      insights.push({
        title: "Common Themes",
        message: \Your reflections often mention: \.\,
        type: "theme",
        emotion: "neutral",
        priority: "low"
      });
    }
    
    // Default insight
    if (insights.length === 0) {
      insights.push({
        title: "Keep Journaling",
        message: "Continue writing to unlock more personalized insights.",
        type: "encouragement",
        emotion: "neutral",
        priority: "low"
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        insights,
        summary: \\ insights from \ reflections\,
        dominantEmotion,
        reflectionCount: totalReflections
      }
    });
    
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights'
    });
  }
};
