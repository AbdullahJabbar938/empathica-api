
module.exports = {
  // Emotion labels for consistency
  EMOTIONS: {
    JOY: "joy",
    SADNESS: "sadness", 
    ANGER: "anger",
    FEAR: "fear",
    SURPRISE: "surprise",
    LOVE: "love",
    NEUTRAL: "neutral",
    STRESS: "stress",
    ANXIETY: "anxiety"
  },
  
  // Sentiment types
  SENTIMENT: {
    POSITIVE: "positive",
    NEGATIVE: "negative",
    NEUTRAL: "neutral"
  },
  
  // User roles
  ROLES: {
    STUDENT: "student",
    ADMIN: "admin"
  },
  
  // Tags for reflections
  TAGS: ["academic", "social", "family", "work", "health", "financial", "personal"],
  
  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },
  
  // Validation limits
  LIMITS: {
    REFLECTION_MIN_LENGTH: 3,
    REFLECTION_MAX_LENGTH: 2000,
    PASSWORD_MIN_LENGTH: 6
  }
};
