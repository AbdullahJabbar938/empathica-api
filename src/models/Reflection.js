const mongoose = require('mongoose');

const ReflectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.Mixed, // CHANGED: Can be ObjectId or String
    required: true
  },
  text: {
    type: String,
    required: [true, 'Please provide reflection text'],
    minlength: [3, 'Reflection must be at least 3 characters'],
    maxlength: [2000, 'Reflection cannot exceed 2000 characters']
  },
  // AI Analysis Results
  emotionLabel: {
    type: String,
    enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'love', 'neutral', 'stress', 'anxiety', 'excitement'],
    default: 'neutral'
  },
  emotionScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  confidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  // COMPLETE TAGS ENUM - ALL POSSIBLE TAGS
  tags: [{
    type: String,
    enum: [
      'academic', 'social', 'family', 'work', 'health', 
      'financial', 'personal', 'testing', 'achievement',
      'validation', 'stress', 'anxiety', 'happiness',
      'growth', 'challenge', 'success', 'struggle',
      'excitement', 'fear', 'anger', 'sadness', 'joy',
      'love', 'surprise', 'neutral', 'deadline',
      'presentation', 'exam', 'relationship', 'friendship',
      'career', 'future', 'past', 'present', 'goal',
      'milestone', 'setback', 'progress', 'learning',
      'development', 'wellness', 'mindfulness', 'gratitude',
      'hope', 'optimism', 'pessimism', 'overwhelm',
      'balance', 'self-care', 'therapy', 'support',
      'celebration', 'accomplishment', 'failure', 'lesson'
    ],
    default: []
  }],
  date: {
    type: Date,
    default: Date.now
  },
  // Metadata
  wordCount: {
    type: Number,
    default: 0
  },
  analysisVersion: {
    type: String,
    default: 'v1.0'
  },
  // Additional metadata for demo/production
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      source: 'api',
      isDemo: false,
      processingTime: 0
    }
  }
});

// Calculate word count before saving
ReflectionSchema.pre('save', function(next) {
  if (this.text && this.text.trim()) {
    // Remove punctuation and split on whitespace
    const cleanText = this.text
      .replace(/[.,!?;:]/g, ' ')  // Replace punctuation with spaces
      .replace(/\s+/g, ' ')      // Normalize multiple spaces
      .trim();                   // Trim whitespace
    
    if (cleanText === '') {
      this.wordCount = 0;
    } else {
      // Split on spaces and filter out empty strings
      const words = cleanText.split(' ').filter(word => word.length > 0);
      this.wordCount = words.length;
    }
  } else {
    this.wordCount = 0;
  }
  next();
});

// Create index for efficient queries
ReflectionSchema.index({ user: 1, date: -1 });
ReflectionSchema.index({ user: 1, emotionLabel: 1 });

module.exports = mongoose.model('Reflection', ReflectionSchema);