// Mental health resources for university students
const resources = [
  {
    id: 1,
    title: "Mindfulness Meditation Guide",
    description: "Learn basic mindfulness techniques to reduce stress and improve focus.",
    category: "meditation",
    url: "https://www.mindful.org/meditation/mindfulness-getting-started/",
    type: "article",
    emotion: "stress",
    duration: "10 min",
    universitySpecific: false
  },
  {
    id: 2,
    title: "University of Manchester Counseling",
    description: "Free confidential counseling services for UoM students.",
    category: "counseling",
    url: "https://www.manchester.ac.uk/studentsupport",
    type: "service",
    emotion: "anxiety",
    duration: "60 min",
    universitySpecific: true
  },
  {
    id: 3,
    title: "5-4-3-2-1 Grounding Technique",
    description: "A simple technique to manage anxiety by focusing on your senses.",
    category: "coping",
    url: "https://www.healthline.com/health/grounding-techniques",
    type: "technique",
    emotion: "anxiety",
    duration: "5 min",
    universitySpecific: false
  },
  {
    id: 4,
    title: "Student Sleep Guide",
    description: "Improve your sleep quality during university studies.",
    category: "wellness",
    url: "https://www.sleepfoundation.org/sleep-hygiene",
    type: "guide",
    emotion: "tired",
    duration: "15 min",
    universitySpecific: true
  },
  {
    id: 5,
    title: "Academic Stress Management",
    description: "Strategies to manage academic pressure and deadlines.",
    category: "academic",
    url: "https://students.manchester.ac.uk/wellbeing/",
    type: "article",
    emotion: "stress",
    duration: "10 min",
    universitySpecific: true
  },
  {
    id: 6,
    title: "Breathing Exercises for Calm",
    description: "Simple breathing techniques to reduce immediate stress.",
    category: "breathing",
    url: "https://www.verywellmind.com/abdominal-breathing-2584115",
    type: "exercise",
    emotion: "stress",
    duration: "5 min",
    universitySpecific: false
  },
  {
    id: 7,
    title: "Student Support Groups",
    description: "Connect with other students facing similar challenges.",
    category: "community",
    url: "https://manchesterstudentsunion.com/support",
    type: "group",
    emotion: "loneliness",
    duration: "60 min",
    universitySpecific: true
  },
  {
    id: 8,
    title: "Time Management for Students",
    description: "Balance studies, work, and personal life effectively.",
    category: "productivity",
    url: "https://learningcommons.ubc.ca/student-toolkits/time-management/",
    type: "guide",
    emotion: "overwhelmed",
    duration: "15 min",
    universitySpecific: true
  }
];

// @desc    Get mental health resources
// @route   GET /api/resources
// @access  Private
exports.getResources = async (req, res, next) => {
  try {
    const { emotion, category, university } = req.query;
    
    let filteredResources = [...resources];
    
    // Filter by emotion if provided
    if (emotion) {
      filteredResources = filteredResources.filter(r => 
        r.emotion.toLowerCase().includes(emotion.toLowerCase())
      );
    }
    
    // Filter by category if provided
    if (category) {
      filteredResources = filteredResources.filter(r => 
        r.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filter by university specific if requested
    if (university === "true") {
      filteredResources = filteredResources.filter(r => r.universitySpecific === true);
    }
    
    res.status(200).json({
      success: true,
      count: filteredResources.length,
      data: filteredResources,
      filters: {
        categories: [...new Set(resources.map(r => r.category))],
        emotions: [...new Set(resources.map(r => r.emotion))],
        types: [...new Set(resources.map(r => r.type))]
      }
    });
    
  } catch (error) {
    console.error('Resources error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resources'
    });
  }
};

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Private
exports.getResource = async (req, res, next) => {
  try {
    const resource = resources.find(r => r.id === parseInt(req.params.id));
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: resource
    });
    
  } catch (error) {
    console.error('Resource error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource'
    });
  }
};
