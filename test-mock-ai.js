// test-mock-ai.js
require('dotenv').config();
const mockAiService = require('./src/services/mockAiService');

async function testMockAI() {
  console.log('🧪 Testing Mock AI Service...\n');
  
  // Test emotion analysis
  const testTexts = [
    "I feel really happy today! Everything is going great.",
    "I'm so sad and lonely, I don't know what to do.",
    "I'm angry about what happened yesterday.",
    "I'm anxious about the upcoming exams.",
    "Today was a normal day, nothing special happened."
  ];
  
  for (const text of testTexts) {
    console.log('Text:', text.substring(0, 50) + '...');
    const result = await mockAiService.analyzeEmotion(text);
    console.log('Result:', {
      emotion: result.emotion,
      score: result.score,
      sentiment: result.sentiment
    });
    console.log('---\n');
  }
  
  // Test insights generation
  const mockReflections = [
    { text: "Feeling good", emotionLabel: "joy", createdAt: new Date() },
    { text: "A bit stressed", emotionLabel: "stress", createdAt: new Date() },
    { text: "Happy day", emotionLabel: "joy", createdAt: new Date() }
  ];
  
  const insights = await mockAiService.generateInsights(mockReflections);
  console.log('📈 Generated Insights:');
  console.log(insights.summary);
  console.log('Trends:', insights.trends);
}

testMockAI().catch(console.error);