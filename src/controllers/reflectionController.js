const Reflection = require("../models/Reflection");
const axios = require("axios");
const mongoose = require("mongoose");

// AI Service Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_API_KEY = process.env.AI_API_KEY || "empathica_ai_secret_key_change_in_production";

// Check if user is demo user
const isDemoUser = (userId) => {
  return typeof userId === 'string' && 
    (userId === 'demo_user_123' || 
     userId.includes('demo') || 
     userId === 'demo_user_123456');
};

// Improved fallback to client-side analysis if AI service is down
const analyzeWithKeywordFallback = (text) => {
    const words = text.toLowerCase().split(" ");
    const positiveWords = ["happy", "good", "great", "excited", "joy", "love", "excellent", "amazing", "wonderful", "positive", "fantastic", "pleased"];
    const negativeWords = ["sad", "bad", "angry", "stress", "anxious", "worried", "depressed", "tired", "overwhelmed", "negative", "terrible", "awful"];
    const stressWords = ["stress", "overwhelmed", "pressure", "deadline", "exam", "assignment", "workload", "busy"];
    const anxietyWords = ["anxious", "worried", "nervous", "afraid", "scared", "fear", "panic", "tense"];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let stressCount = 0;
    let anxietyCount = 0;
    
    words.forEach(word => {
        if (positiveWords.includes(word)) positiveCount++;
        if (negativeWords.includes(word)) negativeCount++;
        if (stressWords.includes(word)) stressCount++;
        if (anxietyWords.includes(word)) anxietyCount++;
    });
    
    // Determine emotion with improved logic
    let emotionLabel = "neutral";
    let emotionScore = 0.5;
    let sentiment = "neutral";
    
    // Priority: anxiety > stress > positive/negative > neutral
    if (anxietyCount > 0) {
        emotionLabel = "anxiety";
        emotionScore = Math.max(0.1, 0.8 - (anxietyCount * 0.1));
        sentiment = "negative";
    } else if (stressCount > 0) {
        emotionLabel = "stress";
        emotionScore = Math.max(0.1, 0.7 - (stressCount * 0.1));
        sentiment = "negative";
    } else if (positiveCount > 0 && positiveCount > negativeCount) {
        emotionLabel = "joy";
        emotionScore = Math.min(0.95, 0.6 + (positiveCount * 0.05));
        sentiment = "positive";
    } else if (negativeCount > 0 && negativeCount > positiveCount) {
        emotionLabel = "sadness";
        emotionScore = Math.max(0.1, 0.4 - (negativeCount * 0.05));
        sentiment = "negative";
    } else if (positiveCount === negativeCount && positiveCount > 0) {
        emotionLabel = "neutral";
        emotionScore = 0.5;
        sentiment = "neutral";
    }
    
    // Add confidence based on keyword match strength
    const totalMatches = positiveCount + negativeCount + stressCount + anxietyCount;
    const confidence = totalMatches > 0 ? Math.min(0.9, 0.5 + (totalMatches * 0.1)) : 0.5;
    
    return {
        emotion: emotionLabel,
        confidence: confidence,
        sentiment: sentiment,
        processing_time: 0,
        source: "keyword_fallback"
    };
};

// Call AI service for emotion analysis
const analyzeWithAI = async (text) => {
    try {
        console.log(`📡 Calling AI service at ${AI_SERVICE_URL}/analyze`);
        
        const response = await axios.post(
            `${AI_SERVICE_URL}/analyze`,
            {
                text: text,
                return_all_scores: false
            },
            {
                headers: {
                    "Authorization": `Bearer ${AI_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 10000 // Increased timeout for reliability
            }
        );
        
        console.log(`✅ AI service response: ${response.data.emotion} (${response.data.confidence})`);
        
        return {
            ...response.data,
            source: "ai_service"
        };
        
    } catch (error) {
        console.error("❌ AI Service Error:", error.message);
        console.log("🔄 Falling back to keyword analysis...");
        
        // Try fallback
        return analyzeWithKeywordFallback(text);
    }
};

// @desc    Create a reflection with AI analysis
// @route   POST /api/reflections
// @access  Private
exports.createReflection = async (req, res, next) => {
    try {
        console.log("📝 Creating new reflection...");
        
        // Add user to req.body
        req.body.user = req.user.id;
        
        const { text, tags } = req.body;

        // Validate text input
        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "Text is required for reflection"
            });
        }

        // DEMO MODE: Return mock reflection immediately
        if (isDemoUser(req.user.id)) {
            console.log("🎮 DEMO MODE: Creating mock reflection");
            
            const mockAnalysis = analyzeWithKeywordFallback(text);
            const mockReflection = {
                _id: 'demo_ref_' + Date.now(),
                user: req.user.id,
                text: text.trim(),
                tags: tags || ['demo'],
                emotionLabel: mockAnalysis.emotion,
                emotionScore: mockAnalysis.confidence,
                sentiment: mockAnalysis.sentiment,
                confidence: mockAnalysis.confidence,
                analysisVersion: 'demo-v1.0',
                date: new Date(),
                wordCount: text.trim().split(' ').length,
                metadata: {
                    source: 'demo',
                    isDemo: true,
                    processingTime: 0,
                    createdAt: new Date()
                }
            };
            
            return res.status(201).json({
                success: true,
                data: mockReflection,
                analysis: {
                    source: "demo_mode",
                    processingTime: 0,
                    emotion: mockAnalysis.emotion,
                    confidence: mockAnalysis.confidence,
                    sentiment: mockAnalysis.sentiment
                }
            });
        }

        // REAL MODE: Analyze with AI
        console.log("🤖 Analyzing emotion...");
        const analysis = await analyzeWithAI(text);
        
        const analysisVersion = analysis.source === "ai_service" ? "v2.0-ai" : "v1.0-keyword";

        console.log(`📊 Analysis complete: ${analysis.emotion} (${analysis.confidence}) from ${analysis.source}`);

        const reflection = await Reflection.create({
            user: req.user.id,
            text: text.trim(),
            tags: tags || [],
            emotionLabel: analysis.emotion,
            emotionScore: analysis.confidence,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
            analysisVersion: analysisVersion,
            date: new Date(),
            metadata: {
                processingTime: analysis.processing_time || 0,
                analysisSource: analysis.source,
                createdAt: new Date()
            }
        });

        console.log(`✅ Reflection saved with ID: ${reflection._id}`);

        res.status(201).json({
            success: true,
            data: reflection,
            analysis: {
                source: analysis.source,
                processingTime: analysis.processing_time || 0,
                emotion: analysis.emotion,
                confidence: analysis.confidence,
                sentiment: analysis.sentiment
            }
        });
    } catch (error) {
        console.error("❌ Error creating reflection:", error);
        
        // More specific error handling
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: "Validation Error",
                details: error.errors
            });
        }
        
        next(error);
    }
};

// @desc    Get all reflections for logged in user
// @route   GET /api/reflections
// @access  Private
exports.getReflections = async (req, res, next) => {
    try {
        // Optional pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        // Optional filters
        const filter = { user: req.user.id };
        
        // Filter by emotion if provided
        if (req.query.emotion) {
            filter.emotionLabel = req.query.emotion;
        }
        
        // Filter by date range if provided
        if (req.query.startDate || req.query.endDate) {
            filter.date = {};
            if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
            if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
        }

        // DEMO MODE: Return mock data
        if (isDemoUser(req.user.id)) {
            console.log("🎮 DEMO MODE: Returning mock reflections");
            
            const mockReflections = [
                {
                    _id: 'ref_1',
                    user: req.user.id,
                    text: 'Feeling excited about my project presentation tomorrow!',
                    emotionLabel: 'joy',
                    emotionScore: 0.87,
                    sentiment: 'positive',
                    tags: ['academic', 'excited'],
                    date: new Date('2024-01-15'),
                    wordCount: 8,
                    analysisVersion: 'demo-v1.0'
                },
                {
                    _id: 'ref_2',
                    user: req.user.id,
                    text: 'Stressed about final exams next week',
                    emotionLabel: 'stress',
                    emotionScore: 0.92,
                    sentiment: 'negative',
                    tags: ['academic', 'exams'],
                    date: new Date('2024-01-16'),
                    wordCount: 7,
                    analysisVersion: 'demo-v1.0'
                }
            ];
            
            return res.status(200).json({
                success: true,
                count: mockReflections.length,
                total: mockReflections.length,
                page: 1,
                pages: 1,
                data: mockReflections,
                isDemo: true
            });
        }

        // REAL MODE: Query database
        const reflections = await Reflection.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');

        const total = await Reflection.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: reflections.length,
            total: total,
            page: page,
            pages: Math.ceil(total / limit),
            data: reflections,
            isDemo: false
        });
    } catch (error) {
        console.error("❌ Error getting reflections:", error);
        
        // Fallback to demo data
        if (isDemoUser(req.user.id)) {
            return res.status(200).json({
                success: true,
                count: 2,
                total: 2,
                page: 1,
                pages: 1,
                data: [],
                isDemo: true
            });
        }
        
        next(error);
    }
};

// @desc    Get single reflection
// @route   GET /api/reflections/:id
// @access  Private
exports.getReflection = async (req, res, next) => {
    try {
        // DEMO MODE: Return mock reflection
        if (isDemoUser(req.user.id)) {
            const mockReflection = {
                _id: req.params.id,
                user: req.user.id,
                text: 'Demo reflection for testing',
                emotionLabel: 'neutral',
                emotionScore: 0.5,
                sentiment: 'neutral',
                tags: ['demo'],
                date: new Date(),
                wordCount: 5,
                analysisVersion: 'demo-v1.0'
            };
            
            return res.status(200).json({
                success: true,
                data: mockReflection,
                isDemo: true
            });
        }

        const reflection = await Reflection.findOne({
            _id: req.params.id,
            user: req.user.id
        }).select('-__v');

        if (!reflection) {
            return res.status(404).json({
                success: false,
                error: 'Reflection not found'
            });
        }

        res.status(200).json({
            success: true,
            data: reflection,
            isDemo: false
        });
    } catch (error) {
        console.error("❌ Error getting reflection:", error);
        next(error);
    }
};

// @desc    Get reflection statistics for dashboard
// @route   GET /api/reflections/stats
// @access  Private
exports.getReflectionStats = async (req, res, next) => {
    try {
        console.log("📊 Generating reflection statistics for user:", req.user.id);
        
        // DEMO MODE: Return mock stats
        if (isDemoUser(req.user.id)) {
            console.log("🎮 DEMO MODE: Returning mock stats");
            
            return res.status(200).json({
                success: true,
                data: {
                    totalReflections: 15,
                    streak: 7,
                    emotionDistribution: [
                        { _id: 'joy', count: 5, avgScore: 0.82 },
                        { _id: 'stress', count: 4, avgScore: 0.75 },
                        { _id: 'neutral', count: 3, avgScore: 0.51 },
                        { _id: 'anxiety', count: 2, avgScore: 0.68 },
                        { _id: 'sadness', count: 1, avgScore: 0.45 }
                    ],
                    timeline: [
                        { _id: '2024-01-15', avgScore: 0.87, count: 1 },
                        { _id: '2024-01-16', avgScore: 0.92, count: 1 },
                        { _id: '2024-01-17', avgScore: 0.78, count: 1 }
                    ],
                    recentReflections: [
                        {
                            text: 'Excited about my project!',
                            emotionLabel: 'joy',
                            emotionScore: 0.87,
                            date: new Date('2024-01-15')
                        },
                        {
                            text: 'Stressed about exams',
                            emotionLabel: 'stress',
                            emotionScore: 0.92,
                            date: new Date('2024-01-16')
                        }
                    ],
                    avgEmotionScore: 0.68,
                    mostCommonEmotion: 'joy',
                    summary: {
                        last7Days: 7,
                        positiveDays: 5,
                        negativeDays: 2
                    },
                    isDemo: true
                }
            });
        }

        // REAL MODE: Query database
        
        // Get emotion distribution
        const emotionDistribution = await Reflection.aggregate([
            {
                $match: { user: new mongoose.Types.ObjectId(req.user.id) }
            },
            {
                $group: {
                    _id: '$emotionLabel',
                    count: { $sum: 1 },
                    avgScore: { $avg: '$emotionScore' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Get timeline data for trend chart (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const timeline = await Reflection.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id),
                    date: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { 
                        $dateToString: { format: "%Y-%m-%d", date: "$date" }
                    },
                    avgScore: { $avg: '$emotionScore' },
                    count: { $sum: 1 },
                    emotions: { 
                        $push: {
                            emotion: "$emotionLabel",
                            score: "$emotionScore"
                        }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Get recent reflections (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentReflections = await Reflection.find({
            user: req.user.id,
            date: { $gte: sevenDaysAgo }
        })
        .sort({ date: -1 })
        .limit(10)
        .select('text emotionLabel emotionScore date');

        // Calculate streak (consecutive days with reflections)
        const allReflections = await Reflection.find({ user: req.user.id }).select('date');
        const uniqueDates = [...new Set(allReflections.map(r => 
            new Date(r.date).toDateString()
        ))].sort();
        
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        while (streak < 365) {
            const dateStr = currentDate.toDateString();
            if (uniqueDates.includes(dateStr)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        const totalReflections = emotionDistribution.reduce((sum, item) => sum + item.count, 0);
        const avgEmotionScore = emotionDistribution.length > 0 
            ? emotionDistribution.reduce((sum, item) => sum + (item.avgScore * item.count), 0) / totalReflections 
            : 0.5;

        res.status(200).json({
            success: true,
            data: {
                totalReflections,
                emotionDistribution,
                timeline,
                recentReflections,
                streak,
                avgEmotionScore: parseFloat(avgEmotionScore.toFixed(2)),
                mostCommonEmotion: emotionDistribution.length > 0 
                    ? emotionDistribution[0]._id 
                    : 'neutral',
                summary: {
                    last7Days: recentReflections.length,
                    positiveDays: timeline.filter(day => day.avgScore > 0.6).length,
                    negativeDays: timeline.filter(day => day.avgScore < 0.4).length
                },
                isDemo: false
            }
        });
    } catch (error) {
        console.error("❌ Error getting reflection stats:", error);
        
        // Fallback to demo data on error
        res.status(200).json({
            success: true,
            data: {
                totalReflections: 10,
                streak: 5,
                emotionDistribution: [
                    { _id: 'neutral', count: 4, avgScore: 0.5 },
                    { _id: 'joy', count: 3, avgScore: 0.8 },
                    { _id: 'stress', count: 2, avgScore: 0.7 },
                    { _id: 'anxiety', count: 1, avgScore: 0.6 }
                ],
                avgEmotionScore: 0.65,
                mostCommonEmotion: 'neutral',
                isDemo: true,
                note: 'Fallback data due to error'
            }
        });
    }
};

// @desc    Update reflection
// @route   PUT /api/reflections/:id
// @access  Private
exports.updateReflection = async (req, res, next) => {
    try {
        // DEMO MODE: Return success
        if (isDemoUser(req.user.id)) {
            return res.status(200).json({
                success: true,
                data: {
                    _id: req.params.id,
                    ...req.body,
                    updatedAt: new Date()
                },
                message: "Reflection updated (Demo Mode)",
                isDemo: true
            });
        }

        let reflection = await Reflection.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!reflection) {
            return res.status(404).json({
                success: false,
                error: 'Reflection not found'
            });
        }

        // Only allow updates to text and tags
        const updateData = {};
        if (req.body.text !== undefined) updateData.text = req.body.text;
        if (req.body.tags !== undefined) updateData.tags = req.body.tags;
        
        // If text changed, re-analyze emotion
        if (req.body.text && req.body.text !== reflection.text) {
            console.log("🔄 Text changed, re-analyzing emotion...");
            const analysis = await analyzeWithAI(req.body.text);
            
            updateData.emotionLabel = analysis.emotion;
            updateData.emotionScore = analysis.confidence;
            updateData.sentiment = analysis.sentiment;
            updateData.confidence = analysis.confidence;
            updateData.analysisVersion = analysis.source === "ai_service" ? "v2.0-ai" : "v1.0-keyword";
            updateData.metadata = {
                ...reflection.metadata,
                lastReanalyzed: new Date(),
                processingTime: analysis.processing_time || 0,
                analysisSource: analysis.source
            };
        }

        reflection = await Reflection.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: reflection,
            message: "Reflection updated successfully",
            isDemo: false
        });
    } catch (error) {
        console.error("❌ Error updating reflection:", error);
        next(error);
    }
};

// @desc    Delete reflection
// @route   DELETE /api/reflections/:id
// @access  Private
exports.deleteReflection = async (req, res, next) => {
    try {
        // DEMO MODE: Return success
        if (isDemoUser(req.user.id)) {
            return res.status(200).json({
                success: true,
                data: {},
                message: "Reflection deleted (Demo Mode)",
                isDemo: true
            });
        }

        const reflection = await Reflection.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!reflection) {
            return res.status(404).json({
                success: false,
                error: 'Reflection not found'
            });
        }

        await reflection.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
            message: "Reflection deleted successfully",
            isDemo: false
        });
    } catch (error) {
        console.error("❌ Error deleting reflection:", error);
        next(error);
    }
};

// @desc    Re-analyze existing reflection with AI
// @route   POST /api/reflections/:id/reanalyze
// @access  Private
exports.reanalyzeReflection = async (req, res, next) => {
    try {
        // DEMO MODE: Return mock analysis
        if (isDemoUser(req.user.id)) {
            const mockAnalysis = {
                emotion: 'joy',
                confidence: 0.85,
                sentiment: 'positive',
                source: 'demo_mode',
                processing_time: 0
            };
            
            return res.status(200).json({
                success: true,
                data: {
                    _id: req.params.id,
                    emotionLabel: mockAnalysis.emotion,
                    emotionScore: mockAnalysis.confidence,
                    sentiment: mockAnalysis.sentiment,
                    analysisVersion: 'demo-v1.0'
                },
                message: "Reflection re-analyzed (Demo Mode)",
                analysis: mockAnalysis,
                isDemo: true
            });
        }

        const reflection = await Reflection.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!reflection) {
            return res.status(404).json({
                success: false,
                error: "Reflection not found"
            });
        }

        console.log(`🔄 Re-analyzing reflection: ${reflection._id}`);
        
        // Re-analyze with AI
        const analysis = await analyzeWithAI(reflection.text);
        
        // Update reflection with new analysis
        reflection.emotionLabel = analysis.emotion;
        reflection.emotionScore = analysis.confidence;
        reflection.sentiment = analysis.sentiment;
        reflection.confidence = analysis.confidence;
        reflection.analysisVersion = analysis.source === "ai_service" ? "v2.0-ai" : "v1.0-keyword";
        reflection.metadata = {
            ...reflection.metadata,
            lastReanalyzed: new Date(),
            processingTime: analysis.processing_time || 0,
            analysisSource: analysis.source,
            reanalysisCount: (reflection.metadata.reanalysisCount || 0) + 1
        };
        
        await reflection.save();

        console.log(`✅ Re-analysis complete: ${analysis.emotion} (${analysis.confidence})`);

        res.status(200).json({
            success: true,
            data: reflection,
            message: "Reflection re-analyzed successfully",
            analysis: {
                source: analysis.source,
                processingTime: analysis.processing_time || 0,
                emotion: analysis.emotion,
                confidence: analysis.confidence,
                sentiment: analysis.sentiment
            },
            isDemo: false
        });
    } catch (error) {
        console.error("❌ Error re-analyzing reflection:", error);
        next(error);
    }
};

// @desc    Get emotions overview
// @route   GET /api/reflections/emotions/overview
// @access  Private
exports.getEmotionsOverview = async (req, res, next) => {
    try {
        // DEMO MODE: Return mock overview
        if (isDemoUser(req.user.id)) {
            return res.status(200).json({
                success: true,
                data: {
                    total: 15,
                    joyCount: 5,
                    sadnessCount: 1,
                    stressCount: 4,
                    anxietyCount: 2,
                    avgScore: 0.68,
                    joyPercentage: '33.3',
                    sadnessPercentage: '6.7',
                    stressPercentage: '26.7',
                    anxietyPercentage: '13.3',
                    moodTrend: "positive",
                    isDemo: true
                }
            });
        }

        const overview = await Reflection.aggregate([
            {
                $match: { user: new mongoose.Types.ObjectId(req.user.id) }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    joyCount: { 
                        $sum: { $cond: [{ $eq: ["$emotionLabel", "joy"] }, 1, 0] }
                    },
                    sadnessCount: { 
                        $sum: { $cond: [{ $eq: ["$emotionLabel", "sadness"] }, 1, 0] }
                    },
                    stressCount: { 
                        $sum: { $cond: [{ $eq: ["$emotionLabel", "stress"] }, 1, 0] }
                    },
                    anxietyCount: { 
                        $sum: { $cond: [{ $eq: ["$emotionLabel", "anxiety"] }, 1, 0] }
                    },
                    avgScore: { $avg: "$emotionScore" }
                }
            }
        ]);

        const data = overview[0] || {
            total: 0,
            joyCount: 0,
            sadnessCount: 0,
            stressCount: 0,
            anxietyCount: 0,
            avgScore: 0.5
        };

        res.status(200).json({
            success: true,
            data: {
                ...data,
                joyPercentage: data.total > 0 ? (data.joyCount / data.total * 100).toFixed(1) : '0',
                sadnessPercentage: data.total > 0 ? (data.sadnessCount / data.total * 100).toFixed(1) : '0',
                stressPercentage: data.total > 0 ? (data.stressCount / data.total * 100).toFixed(1) : '0',
                anxietyPercentage: data.total > 0 ? (data.anxietyCount / data.total * 100).toFixed(1) : '0',
                moodTrend: data.avgScore > 0.6 ? "positive" : data.avgScore < 0.4 ? "negative" : "neutral",
                isDemo: false
            }
        });
    } catch (error) {
        console.error("❌ Error getting emotions overview:", error);
        next(error);
    }
};