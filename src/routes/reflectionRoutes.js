// api/src/routes/reflectionRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Your existing route - make sure it's at /stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await Reflection.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          lastEntry: { $max: '$createdAt' },
          avgScore: { $avg: '$emotionScore' },
          emotionCounts: { $push: '$emotionLabel' }
        }
      }
    ]);
    
    // Return proper response structure
    res.json({ 
      success: true, 
      data: stats[0] || {
        total: 0,
        lastEntry: null,
        avgScore: 0,
        emotionCounts: []
      } 
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;