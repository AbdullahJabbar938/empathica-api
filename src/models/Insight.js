const mongoose = require("mongoose");

const InsightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reflection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reflection"
  },
  type: {
    type: String,
    enum: ["pattern", "tip", "reminder", "achievement"],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  relatedEmotions: [String],
  isRead: {
    type: Boolean,
    default: false
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date
});

module.exports = mongoose.model("Insight", InsightSchema);
