// api/src/utils/demoData.js
const getMockReflections = (userId) => [
  {
    _id: 'ref_1',
    user: userId,
    text: 'Feeling excited about my project presentation tomorrow!',
    emotionLabel: 'joy',
    emotionScore: 0.87,
    sentiment: 'positive',
    tags: ['academic', 'excited'],
    date: new Date('2024-01-15')
  },
  {
    _id: 'ref_2',
    user: userId,
    text: 'Stressed about final exams next week',
    emotionLabel: 'stress',
    emotionScore: 0.92,
    sentiment: 'negative',
    tags: ['academic', 'exams'],
    date: new Date('2024-01-16')
  },
  {
    _id: 'ref_3',
    user: userId,
    text: 'Had a great time with friends today',
    emotionLabel: 'joy',
    emotionScore: 0.78,
    sentiment: 'positive',
    tags: ['social', 'friends'],
    date: new Date('2024-01-17')
  },
  {
    _id: 'ref_4',
    user: userId,
    text: 'Feeling anxious about the job interview',
    emotionLabel: 'anxiety',
    emotionScore: 0.85,
    sentiment: 'negative',
    tags: ['career', 'interview'],
    date: new Date('2024-01-18')
  }
];

const getMockStats = () => ({
  totalReflections: 15,
  streak: 7,
  emotionDistribution: [
    { _id: 'joy', count: 5 },
    { _id: 'stress', count: 4 },
    { _id: 'neutral', count: 3 },
    { _id: 'anxiety', count: 2 },
    { _id: 'sadness', count: 1 }
  ]
});

module.exports = { getMockReflections, getMockStats };