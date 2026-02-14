// api/src/services/mockAiService.js

const mockAiService = {
  analyzeEmotion: async (text) => {
    console.log('📝 Mock AI analyzing text:', text.substring(0, 100) + '...');
    
    // Simple keyword-based emotion detection
    const emotions = {
      joy: ['happy', 'joy', 'good', 'great', 'excited', 'love', 'wonderful', 'amazing', 'fantastic'],
      sadness: ['sad', 'bad', 'terrible', 'cry', 'alone', 'depressed', 'lonely', 'hurt'],
      anger: ['angry', 'mad', 'hate', 'frustrated', 'annoyed', 'upset', 'irritated'],
      fear: ['scared', 'afraid', 'fear', 'worried', 'anxious', 'nervous', 'panic'],
      surprise: ['wow', 'surprised', 'shocked', 'unexpected', 'amazing'],
      love: ['love', 'adore', 'cherish', 'affection', 'caring'],
      stress: ['stress', 'pressure', 'overwhelmed', 'busy', 'tired'],
      anxiety: ['anxious', 'nervous', 'worried', 'uneasy', 'restless'],
      neutral: []
    };

    const lowerText = text.toLowerCase();
    let detectedEmotion = 'neutral';
    let confidence = 0.5;
    let matchedKeywords = [];
    
    // Check for emotion keywords
    for (const [emotion, keywords] of Object.entries(emotions)) {
      const foundKeywords = keywords.filter(keyword => 
        lowerText.includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0 && foundKeywords.length > matchedKeywords.length) {
        detectedEmotion = emotion;
        matchedKeywords = foundKeywords;
        confidence = Math.min(0.3 + (foundKeywords.length * 0.1), 0.95);
      }
    }
    
    // If no keywords found but text has sentiment indicators
    if (detectedEmotion === 'neutral') {
      const positiveWords = lowerText.match(/\b(good|nice|well|ok|fine|better)\b/g);
      const negativeWords = lowerText.match(/\b(bad|not good|struggling|hard|difficult)\b/g);
      
      if (positiveWords && positiveWords.length > 2) {
        detectedEmotion = 'joy';
        confidence = 0.6;
      } else if (negativeWords && negativeWords.length > 2) {
        detectedEmotion = 'sadness';
        confidence = 0.6;
      }
    }
    
    // Calculate a realistic score between 0 and 1
    const score = confidence;
    
    // Generate analysis text
    const analyses = {
      joy: "Your text shows positive emotions. This is great for mental well-being.",
      sadness: "Your text suggests some sadness. Remember it's okay to feel this way.",
      anger: "There's frustration in your words. Consider healthy outlets for these feelings.",
      fear: "Your text indicates some anxiety. Deep breathing might help.",
      neutral: "Your text appears neutral. Sometimes just expressing helps.",
      love: "Your text shows caring emotions. Nurture these feelings.",
      stress: "Your text suggests stress. Consider mindfulness techniques.",
      anxiety: "Your text shows anxiety symptoms. Gentle self-care is important."
    };
    
    return {
      emotion: detectedEmotion,
      score: score,
      confidence: confidence,
      keywords: matchedKeywords.slice(0, 5),
      analysis: analyses[detectedEmotion] || "Your emotions have been analyzed.",
      sentiment: ['joy', 'love', 'surprise'].includes(detectedEmotion) ? 'positive' : 
                ['sadness', 'anger', 'fear', 'stress', 'anxiety'].includes(detectedEmotion) ? 'negative' : 'neutral',
      intensity: score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low',
      recommendations: [
        "Consider journaling regularly",
        "Practice mindfulness meditation",
        "Reach out to supportive friends or family"
      ]
    };
  },

  generateInsights: async (reflections) => {
    console.log('📊 Mock AI generating insights for', reflections.length, 'reflections');
    
    // Mock insights based on reflection data
    const totalReflections = reflections.length;
    const recentReflections = reflections.slice(-7); // Last 7 days
    
    // Calculate mock trends
    const emotions = recentReflections.map(r => r.emotionLabel || 'neutral');
    const mostCommonEmotion = emotions.reduce((a, b, i, arr) => 
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b, 'neutral'
    );
    
    const positiveDays = emotions.filter(e => 
      ['joy', 'love', 'surprise'].includes(e)
    ).length;
    
    const moodScore = (positiveDays / 7) * 10;
    
    return {
      summary: `Based on your ${totalReflections} reflections, you've been expressing yourself consistently.`,
      trends: [
        `Most common emotion: ${mostCommonEmotion}`,
        `${positiveDays} out of last 7 days showed positive emotions`,
        `You tend to write more during ${getMostActiveTime(recentReflections)}`
      ],
      patterns: [
        "Your writing becomes more detailed on weekends",
        "Morning reflections tend to be more optimistic",
        "You use more expressive language when discussing personal achievements"
      ],
      recommendations: [
        "Try journaling at a consistent time each day",
        "Explore different writing prompts for variety",
        "Consider discussing patterns with a mental health professional"
      ],
      stats: {
        totalReflections,
        recentReflections: recentReflections.length,
        averageWords: calculateAverageWords(recentReflections),
        moodScore: moodScore.toFixed(1),
        consistencyScore: ((recentReflections.length / 7) * 100).toFixed(1) + '%',
        emotionDistribution: countEmotions(emotions)
      },
      timestamp: new Date().toISOString()
    };
  }
};

// Helper functions
function getMostActiveTime(reflections) {
  const hours = reflections.map(r => new Date(r.createdAt).getHours());
  const morning = hours.filter(h => h >= 6 && h < 12).length;
  const afternoon = hours.filter(h => h >= 12 && h < 18).length;
  const evening = hours.filter(h => h >= 18 && h < 24).length;
  const night = hours.filter(h => h >= 0 && h < 6).length;
  
  const times = { morning, afternoon, evening, night };
  const mostActive = Object.entries(times).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  return mostActive + 's';
}

function calculateAverageWords(reflections) {
  const totalWords = reflections.reduce((sum, r) => 
    sum + (r.text ? r.text.split(/\s+/).length : 0), 0
  );
  return Math.round(totalWords / reflections.length) || 0;
}

function countEmotions(emotions) {
  const counts = {};
  emotions.forEach(emotion => {
    counts[emotion] = (counts[emotion] || 0) + 1;
  });
  return counts;
}

module.exports = mockAiService;