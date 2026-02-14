const express = require("express");
const router = express.Router();

// Mental health resources
router.get("/", (req, res) => {
  const resources = [
    {
      id: "1",
      type: "crisis",
      title: "Crisis Support",
      description: "Immediate help when you need it most",
      icon: "🆘",
      contacts: [
        { 
          name: "National Suicide Prevention Lifeline", 
          phone: "988", 
          website: "https://988lifeline.org",
          available: "24/7"
        },
        { 
          name: "Crisis Text Line", 
          text: "Text HOME to 741741", 
          website: "https://www.crisistextline.org",
          available: "24/7"
        }
      ]
    },
    {
      id: "2",
      type: "university",
      title: "University Counseling Services",
      description: "Your campus mental health support",
      icon: "🏫",
      contacts: [
        { 
          name: "Student Counseling Center", 
          phone: "(555) 123-4567", 
          email: "counseling@university.edu",
          hours: "Mon-Fri 9am-5pm"
        },
        { 
          name: "Health & Wellness Center", 
          phone: "(555) 987-6543", 
          website: "https://health.university.edu",
          hours: "Mon-Fri 8am-6pm"
        }
      ]
    },
    {
      id: "3",
      type: "self_help",
      title: "Self-Help Resources",
      description: "Tools and techniques for self-care",
      icon: "🧠",
      resources: [
        { 
          name: "Mindfulness & Meditation", 
          url: "https://www.mindful.org/meditation/mindfulness-getting-started/",
          duration: "5-15 minutes",
          description: "Guided mindfulness exercises"
        },
        { 
          name: "CBT Techniques", 
          url: "https://www.psychologytools.com/self-help/",
          duration: "10-30 minutes",
          description: "Cognitive Behavioral Therapy exercises"
        },
        { 
          name: "Breathing Exercises", 
          url: "https://www.health.harvard.edu/mind-and-mood/relaxation-techniques-breath-control",
          duration: "3-5 minutes",
          description: "Calming breathing techniques"
        }
      ]
    },
    {
      id: "4",
      type: "academic",
      title: "Academic Support",
      description: "Resources for academic success",
      icon: "📚",
      contacts: [
        { 
          name: "Academic Advising", 
          phone: "(555) 555-1234", 
          email: "advising@university.edu"
        },
        { 
          name: "Writing Center", 
          phone: "(555) 555-5678", 
          website: "https://writingcenter.university.edu"
        }
      ]
    }
  ];
  
  res.json({
    success: true,
    count: resources.length,
    data: resources
  });
});

// Get specific resource by type
router.get("/:type", (req, res) => {
  const resources = [
    // Same data as above
  ];
  
  const filteredResources = resources.filter(r => r.type === req.params.type);
  
  if (filteredResources.length === 0) {
    return res.status(404).json({
      success: false,
      error: "No resources found for this type"
    });
  }
  
  res.json({
    success: true,
    data: filteredResources
  });
});

module.exports = router;