const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Content = require('../models/Content');
const isLoggedIn = require('../middleware/isLoggedIn');

// Enhanced dashboard route
router.get('/enhanced-dashboard', (req, res) => {
    res.render('enhanced-dashboard');
});

// GET /dashboard - User home with personalized content
router.get('/dashboard', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    // Normalize interests to Map
    let interests = user.interests;
    if (!(interests instanceof Map)) {
      interests = new Map(Object.entries(interests || {}));
    }

    // Sort user's subjects by interest count descending
    const subjectsWithScores = user.subjects.map(subject => ({
      subject,
      score: interests.get(subject) || 0,
    })).sort((a, b) => b.score - a.score);

    const sortedSubjects = subjectsWithScores.map(s => s.subject);

    // Fetch videos for all user's subjects
    let videos = await Content.find({ subject: { $in: user.subjects } });

    // **Replace your current video sorting with this:**
    const interestScores = new Map(subjectsWithScores.map(({ subject, score }) => [subject, score]));
    videos = videos.sort((a, b) => {
      const scoreA = interestScores.get(a.subject) || 0;
      const scoreB = interestScores.get(b.subject) || 0;
      return scoreB - scoreA; // descending order by interest score
    });

    console.log("User Fullname:", user.fullname);
    console.log("User Subjects:", user.subjects);
    console.log("User Interests:", user.interests);
    console.log("Sorted Subjects:", sortedSubjects);

    res.render('uhome', {
      fullname: user.fullname,
      user: {
        subjects: user.subjects,
        interests: Object.fromEntries(interests)
      },
      sortedSubjects,
      contentList: videos
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Server error');
  }
});


// GET /api/videos/:subject - Get videos for a specific subject
router.get('/api/videos/:subject', isLoggedIn, async (req, res) => {
  try {
    const subject = req.params.subject;
    const videos = await Content.find({ subject });
    res.json(videos);
  } catch (err) {
    console.error('API videos error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /search?q= - Search videos by title, description, or subject
router.get('/search', isLoggedIn, async (req, res) => {
  const query = req.query.q || '';
  const regex = new RegExp(query, 'i'); // case-insensitive regex

  try {
    const results = await Content.find({
      $or: [
        { title: regex },
        { description: regex },
        { subject: regex }
      ]
    });

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /track-interest - Track user's interest on subject or specific video
router.post('/track-interest', isLoggedIn, async (req, res) => {
  const { subject, videoId } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.interests) {
      user.interests = new Map();
    }

    if (subject) {
      const currentCount = user.interests.get(subject) || 0;
      user.interests.set(subject, currentCount + 1);
    }

    if (videoId) {
      const key = `video:${videoId}`;
      const currentCount = user.interests.get(key) || 0;
      user.interests.set(key, currentCount + 1);
    }

    await user.save();
    res.status(200).json({ message: 'Interest updated' });
  } catch (err) {
    console.error('Track interest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat interface route
router.get('/chat', (req, res) => {
    res.render('chat');
});

// Progress Dashboard route
router.get('/progress', isLoggedIn, (req, res) => {
    res.render('progress-dashboard');
});

// Quiz interface route
router.get('/quiz', isLoggedIn, (req, res) => {
    res.render('quiz');
});

// Test quiz route (no auth required for testing)
router.get('/quiz-test', (req, res) => {
    res.render('quiz');
});

module.exports = router;
