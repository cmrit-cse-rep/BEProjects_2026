const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const bcrypt = require('bcryptjs');

console.log('SERVER: env loaded');

const app = express();
console.log('SERVER: express app created');

// CORS configuration
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
console.log('SERVER: allowedOrigin=', allowedOrigin);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like curl, mobile apps, or server-to-server)
    if (!origin) return callback(null, true);
    // allow all when FRONTEND_ORIGIN is '*', or allow a comma-separated list
    if (allowedOrigin === '*' || allowedOrigin.split(',').includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('CORS policy: Origin not allowed'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// (Removed diagnostic wrapper to avoid interfering with Express route registration.)

// Basic route for testing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landingpage.html'));
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Articles API endpoint
app.get('/api/articles', (req, res) => {
    // Sample articles data
    const articles = [
        {
            id: '1',
            title: 'Understanding Anxiety Disorders',
            category: 'Anxiety',
            excerpt: 'Learn about the different types of anxiety disorders and their symptoms.',
            content: 'Anxiety disorders are a group of mental health conditions characterized by feelings of worry, anxiety, or fear that are strong enough to interfere with one\'s daily activities.\n\nTypes of anxiety disorders include generalized anxiety disorder, panic disorder, phobias, social anxiety disorder, obsessive-compulsive disorder, and post-traumatic stress disorder.\n\nSymptoms can include restlessness, increased heart rate, rapid breathing, difficulty sleeping, and trouble concentrating.\n\nTreatment typically includes therapy, medication, or a combination of both. Cognitive-behavioral therapy (CBT) is particularly effective for anxiety disorders.',
            image: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1780&q=80',
            readTime: '5 min'
        },
        {
            id: '2',
            title: 'The Power of Mindfulness Meditation',
            category: 'Mindfulness',
            excerpt: 'Discover how mindfulness meditation can reduce stress and improve mental well-being.',
            content: 'Mindfulness meditation is a mental training practice that teaches you to slow down racing thoughts, let go of negativity, and calm both your mind and body.\n\nIt combines meditation with the practice of mindfulness, which is being aware of your body, mind, and feelings in the present moment.\n\nRegular practice has been shown to reduce stress, anxiety, and depression, improve focus and concentration, and even boost the immune system.\n\nTo practice mindfulness meditation, find a quiet place, sit comfortably, focus on your breath, and when your mind wanders, gently bring your attention back to your breath.',
            image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1702&q=80',
            readTime: '7 min'
        },
        {
            id: '3',
            title: 'Coping with Depression: Strategies That Work',
            category: 'Depression',
            excerpt: 'Effective strategies to manage depression symptoms and improve quality of life.',
            content: 'Depression is more than just feeling sad. It\'s a serious mental health condition that affects how you feel, think, and handle daily activities.\n\nCoping strategies include establishing routines, setting realistic goals, exercising regularly, maintaining a healthy diet, getting enough sleep, and staying connected with others.\n\nChallenging negative thoughts is also important. This involves identifying negative patterns of thinking and replacing them with more balanced thoughts.\n\nSeeking professional help is crucial for managing depression. This can include therapy, medication, or a combination of both.',
            image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1674&q=80',
            readTime: '6 min'
        },
        {
            id: '4',
            title: 'Building Resilience in Challenging Times',
            category: 'Resilience',
            excerpt: 'Learn how to develop resilience to better cope with life\'s challenges.',
            content: 'Resilience is the ability to adapt and bounce back when things don\'t go as planned. It\'s a quality that helps us face challenges, cope with adversity, and rebuild our lives after a setback.\n\nBuilding resilience involves developing a positive attitude, practicing self-compassion, building a strong support network, taking care of your physical health, and finding purpose in your experiences.\n\nIt\'s also important to accept change as a part of life, maintain perspective, and learn from your past experiences.\n\nRemember that building resilience is a journey, not a destination. It requires time, effort, and practice.',
            image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1746&q=80',
            readTime: '8 min'
        },
        {
            id: '5',
            title: 'The Connection Between Physical and Mental Health',
            category: 'Wellness',
            excerpt: 'Explore the important relationship between physical health and mental well-being.',
            content: 'The mind and body are intrinsically connected. Physical health problems can lead to increased risk of developing mental health problems, and vice versa.\n\nRegular physical activity has been shown to reduce symptoms of depression and anxiety, improve mood, boost energy levels, and promote better sleep.\n\nA balanced diet rich in fruits, vegetables, lean proteins, and whole grains provides the nutrients your brain needs to function optimally.\n\nAdequate sleep is also crucial for mental health. Poor sleep can contribute to the development of mental health problems, while good sleep can help improve resilience and overall well-being.',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
            readTime: '5 min'
        },
        {
            id: '6',
            title: 'Supporting a Loved One with Mental Health Issues',
            category: 'Support',
            excerpt: 'How to effectively support someone you care about who is struggling with mental health.',
            content: 'Supporting a loved one with mental health issues can be challenging, but your support can make a significant difference in their recovery.\n\nStart by educating yourself about their condition. Understanding what they\'re going through can help you provide better support.\n\nListen without judgment. Sometimes, the most helpful thing you can do is simply be there and listen.\n\nEncourage them to seek professional help, but respect their decisions. Offer to help them find resources or accompany them to appointments if they\'re comfortable with that.\n\nTake care of your own mental health too. Supporting someone with mental health issues can be emotionally taxing, so make sure to practice self-care.',
            image: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
            readTime: '6 min'
        },
        {
            id: '7',
            title: 'Managing Stress in a Fast-Paced World',
            category: 'Stress Management',
            excerpt: 'Practical techniques for managing stress in today\'s busy world.',
            content: 'Stress is a natural response to challenging situations, but chronic stress can have negative effects on both physical and mental health.\n\nEffective stress management techniques include identifying your stress triggers, practicing relaxation techniques like deep breathing or progressive muscle relaxation, maintaining a healthy lifestyle, and setting boundaries.\n\nTime management is also crucial. Prioritize tasks, break large projects into smaller steps, and don\'t be afraid to ask for help when needed.\n\nMindfulness can help you stay grounded in the present moment rather than worrying about the future or dwelling on the past.\n\nRemember that it\'s okay to take breaks and engage in activities you enjoy. Self-care is not selfish; it\'s necessary for your well-being.',
            image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1702&q=80',
            readTime: '7 min'
        }
    ];
    
    res.json(articles);
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  // Removed deprecated options
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

// Gemini AI Init
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_API_KEY is missing in .env');
  throw new Error("GOOGLE_API_KEY is required");
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });


// Define helper functions
function getDepressionLevel(score) {
  if (score <= 10) return 'Minimal';
  if (score <= 20) return 'Mild';
  if (score <= 30) return 'Moderate';
  if (score <= 40) return 'Moderately Severe';
  return 'Severe';
}

function generateSummary(score, level) {
  const summaries = {
    'Minimal': 'Your responses indicate minimal symptoms of depression. Continue maintaining your healthy lifestyle and self-care practices.',
    'Mild': 'Your responses suggest mild symptoms of depression. Consider implementing some self-care strategies and reaching out to your support network.',
    'Moderate': 'Your responses indicate moderate symptoms of depression. Professional support would be beneficial. Consider speaking with a mental health professional.',
    'Moderately Severe': 'Your responses suggest moderately severe symptoms of depression. Professional help is strongly recommended. Please reach out to a mental health professional.',
    'Severe': 'Your responses indicate severe symptoms of depression. Immediate professional help is crucial. Please contact a mental health professional or crisis hotline right away.'
  };
  return summaries[level] || 'Please consult with a mental health professional for personalized guidance.';
}

function getRecommendations(level) {
  const recommendations = {
    'Minimal': [
      'Continue your current healthy lifestyle practices',
      'Maintain regular exercise routine (20-30 minutes daily)',
      'Keep nurturing your social relationships',
      'Practice gratitude daily',
      'Prioritize quality sleep (7-9 hours)',
      'Engage in hobbies and activities you enjoy',
      'Consider mindfulness or meditation'
    ],
    'Mild': [
      'Start each day with one small positive action',
      'Create a simple daily routine',
      'Practice the "5-4-3-2-1" grounding technique',
      'Try journaling for 5-10 minutes daily',
      'Engage in regular physical activity',
      'Connect with supportive friends or family',
      'Consider self-help resources',
      'Limit alcohol and caffeine',
      'Practice deep breathing exercises',
      'Set small, achievable goals each day'
    ],
    'Moderate': [
      'Reach out to a mental health professional',
      'Consider joining a depression support group',
      'Establish a structured daily routine',
      'Practice "behavioral activation"',
      'Use the "HALT" check-in technique',
      'Try cognitive restructuring',
      'Maintain social connections',
      'Create a "mood toolkit"',
      'Practice relaxation techniques',
      'Keep a mood diary'
    ],
    'Moderately Severe': [
      'Schedule an appointment with a psychiatrist',
      'Consider intensive outpatient programs',
      'Discuss medication options with a healthcare provider',
      'Engage in evidence-based therapy',
      'Create a safety plan with your therapist',
      'Involve trusted family members or friends',
      'Maintain basic self-care routines',
      'Use crisis resources when needed',
      'Try to maintain some social contact',
      'Focus on very small, manageable goals'
    ],
    'Severe': [
      'Seek immediate professional help',
      'Contact crisis hotline if needed',
      'Reach out to trusted support system',
      'Consider psychiatric hospitalization if necessary',
      'Work with a psychiatrist for medication',
      'Engage in intensive therapy',
      'Accept help with basic needs',
      'Remove potentially harmful items',
      'Create a detailed safety plan',
      'Focus on surviving each day'
    ]
  };
  return recommendations[level] || ['Please consult with a mental health professional for personalized guidance.'];
}

function getRiskLevel(score) {
  if (score <= 20) return 'Low Risk';
  if (score <= 35) return 'Moderate Risk';
  return 'High Risk';
}

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  age: Number,
  gender: String,
  medicalHistory: String,
  currentMedications: String,
  preferences: {
    notificationFrequency: String,
    therapyPreference: String,
    activityReminders: Boolean,
  },
  quizCompleted: Boolean,
  quizScore: Number,
  // Latest generated depression assessment report
  report: {
    timestamp: Date,
    quizScore: Number,
    level: String,
    summary: String,
    riskLevel: String,
    recommendations: [String],
    responses: mongoose.Schema.Types.Mixed,
  },
  registrationDate: { type: Date, default: Date.now },
  moodEntries: {
    type: [
    {
      value: Number,
      label: String,
      emoji: String,
      notes: String,
      date: { type: Date, default: Date.now },
    }
    ],
    default: []
  },
  diaryEntries: {
    type: [
    {
      original: String,
      reframed: String,
      date: { type: Date, default: Date.now },
    }
    ],
    default: []
  },
  dailyTasks: {
    type: [
    {
      task: String,
      time: String,
      completed: { type: Boolean, default: false },
      date: { type: Date, default: () => new Date(new Date().setHours(0, 0, 0, 0)) },
    }
    ],
    default: []
  },
  cbtReports: {
    type: [{
      initialMood: String,
      currentMood: String,
      situation: String,
      automaticThought: String,
      emotions: String,
      cognitiveDistortion: String,
      reframedThought: String,
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  }
});

const User = mongoose.model('User', UserSchema);

// Chat endpoint with Gemini AI
app.post('/api/chat', async (req, res) => {
    const { message, email, history, language } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
        console.error('Google API key is missing');
        return res.status(500).json({ error: 'Google API key is not configured' });
    }

    try {
        console.log('Sending request to Gemini...');

        // Load user for personalization (optional)
        let userProfileSummary = 'unknown user';
        let recentMoodSummary = 'no recent mood entries';
        if (email) {
            try {
                const user = await User.findOne({ email });
                if (user) {
                    const prefs = user.preferences || {};
                    userProfileSummary = `Name: ${user.name || 'N/A'}; Age: ${user.age || 'N/A'}; Gender: ${user.gender || 'N/A'}; MedicalHistory: ${user.medicalHistory || 'none'}; CurrentMedications: ${user.currentMedications || 'none'}; Preferences: therapy=${prefs.therapyPreference || 'N/A'}, reminders=${prefs.activityReminders ? 'on' : 'off'}, notificationFrequency=${prefs.notificationFrequency || 'N/A'}`;
                    const recent = (user.moodEntries || [])
                        .slice(-5)
                        .map(e => `${new Date(e.date).toISOString().split('T')[0]}: ${e.label || e.value} ${e.emoji || ''}${e.notes ? ` (${e.notes})` : ''}`)
                        .join('; ');
                    if (recent && recent.length > 0) recentMoodSummary = recent;
                }
            } catch (e) {
                console.warn('Personalization lookup failed:', e?.message);
            }
        }

        // Extract mood rating if available in history
        let moodRating = 'unknown';
        if (history && history.length > 0) {
            const firstUserMessage = history.find(msg => msg.role === 'user');
            if (firstUserMessage && !isNaN(firstUserMessage.content) && firstUserMessage.content >= 1 && firstUserMessage.content <= 10) {
                moodRating = firstUserMessage.content;
            }
        }

        // Create a context-aware prompt
        const targetLanguageLine = language && language !== 'auto' ? `Respond in ${language}.` : 'Respond in the same language as the user message.';
        const prompt = `You are a concise CBT therapist. ${targetLanguageLine}

Personalization:
- User: ${userProfileSummary}
- Recent mood entries: ${recentMoodSummary}
- Current mood (from conversation): ${moodRating}/10

User message:
${message}

Your response must be under 120 words and structured as:
1) Validation (1 sentence)
2) Cognitive distortion (if applicable, 1 sentence)
3) Reframe (1-2 sentences)
4) One personalized, practical recommendation (consider medical history, medications, preferences, and recent moods; 1 sentence)`;

        // Generate response with proper error handling
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        if (!response || !response.text) {
            throw new Error('Invalid Gemini response');
        }

        const reply = response.text();

        console.log('Gemini response received:', reply.substring(0, 100) + '...');
        res.json({ reply });
    } catch (error) {
        console.error('FULL GEMINI ERROR:', error);
        console.error('Detailed error:', error);
        
        // Send a more user-friendly error message
        let errorMessage;
        if (error.message.includes('Empty response')) {
            errorMessage = 'The AI system is currently having trouble generating a response. Please try again.';
        } else if (error.message.includes('Invalid response format')) {
            errorMessage = 'Received an unexpected response format. Please try again.';
        } else {
            errorMessage = 'There was an issue processing your message. Please try again in a moment.';
        }
            
        res.status(500).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Save CBT Report endpoint
app.post('/api/cbt-report', async (req, res) => {
    const { email, report } = req.body;
    if (!email || !report) {
        return res.status(400).json({ error: 'Email and report data are required' });
    }

    try {
        const user = await User.findOneAndUpdate(
            { email },
            { $push: { cbtReports: report } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'CBT report saved successfully' });
    } catch (error) {
        console.error('Error saving CBT report:', error);
        res.status(500).json({ error: 'Failed to save CBT report' });
    }
});

// Get CBT Reports endpoint
app.get('/api/cbt-reports/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const reports = user.cbtReports.sort((a, b) => b.createdAt - a.createdAt);
        res.json(reports);
    } catch (error) {
        console.error('Error fetching CBT reports:', error);
        res.status(500).json({ error: 'Failed to fetch CBT reports' });
    }
});

// ---------------- AUTH ----------------

app.post('/api/register', async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    // Hash the password before saving
    const hashed = bcrypt.hashSync(password, 10);

    const newUser = new User({ ...rest, password: hashed, registrationDate: new Date() });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' });

    res.json({
      message: 'Login successful',
      user: {
        name: user.name,
        email: user.email,
        quizCompleted: user.quizCompleted,
        quizScore: user.quizScore,
        preferences: user.preferences,
        moodEntries: (user.moodEntries || []).slice(-7),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ================== SETTINGS ==================

// Update user profile
app.post('/api/update-profile', async (req, res) => {
  const { email, name, bio } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { name, medicalHistory: bio },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
app.post('/api/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    // Update password
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Update notification preferences
app.post('/api/preferences/notifications', async (req, res) => {
  const { email, emailNotifications, newsletter, communityUpdates } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { 
        'preferences.notificationFrequency': emailNotifications ? 'weekly' : 'never',
        'preferences.activityReminders': communityUpdates
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Notification preferences updated', user });
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Update privacy settings
app.post('/api/preferences/privacy', async (req, res) => {
  const { email, profileVisibility, activityStatus, dataUsage } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { preferences: { profileVisibility, activityStatus, dataUsage } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Privacy settings updated', user });
  } catch (error) {
    console.error('Privacy update error:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// Delete account
app.post('/api/delete-account', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify password before deletion
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }
    
    // Delete user
    await User.findOneAndDelete({ email });
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ================== END SETTINGS ==================

// ---------------- QUIZ ----------------

app.post('/api/submit-quiz', async (req, res) => {
  const { email, responses } = req.body;
  const totalScore = Object.values(responses).reduce((sum, val) => sum + parseInt(val), 0);
  const level = getDepressionLevel(totalScore);

  console.log('Generating report with:', {
    totalScore,
    level,
    recommendations: getRecommendations(level)
  });

  const report = {
    timestamp: new Date(),
    quizScore: totalScore,
    level: level,
    summary: generateSummary(totalScore, level),
    riskLevel: getRiskLevel(totalScore),
    recommendations: getRecommendations(level),
    responses: responses
  };

  console.log('Generated report:', report);

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { 
        quizCompleted: true, 
        quizScore: totalScore,
        report: report
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Report generated successfully',
      report: report
    });
  } catch (err) {
    console.error('Error saving report:', err);
    res.status(500).json({ error: 'Failed to save report' });
  }
});


// ---------------- MOOD TRACKER ----------------

app.post('/api/mood', async (req, res) => {
  const { email, mood } = req.body;
  if (!email || !mood) return res.status(400).json({ error: 'Missing email or mood data' });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existingEntry = (user.moodEntries || []).find(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= today && entryDate < tomorrow;
    });

    if (existingEntry) {
      await User.updateOne(
        { email, 'moodEntries._id': existingEntry._id },
        {
          $set: {
            'moodEntries.$.value': mood.value,
            'moodEntries.$.label': mood.label,
            'moodEntries.$.emoji': mood.emoji,
            'moodEntries.$.notes': mood.notes,
            'moodEntries.$.date': new Date(),
          },
        }
      );
    } else {
      await User.updateOne({ email }, { $push: { moodEntries: mood } });
    }

    res.json({ message: 'Mood logged successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save mood' });
  }
});

app.get('/api/mood-history/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email }, { moodEntries: 1 });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const sortedEntries = user.moodEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ moodEntries: sortedEntries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
});

// ---------------- DIARY ----------------

app.post('/api/diary', async (req, res) => {
  const { email, text } = req.body;
  if (!email || !text) return res.status(400).json({ error: 'Missing diary or email' });

  try {
    const prompt = `Reframe this diary entry positively but keep its meaning and tone similar:\n"${text}"`;
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = result.response.text().trim();
    const reframed = response || "You're doing your best. Keep going!";

    const updateResult = await User.updateOne(
      { email },
      { $push: { diaryEntries: { original: text, reframed, date: new Date() } } }
    );

    if (updateResult.modifiedCount === 0)
      return res.status(404).json({ error: 'User not found' });

    res.json({ reframed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reframe diary entry' });
  }
});

app.get('/api/diary/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const sorted = user.diaryEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ entries: sorted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diary entries' });
  }
});

// ---------------- REPORT ----------------
// Get latest generated depression report for a user
app.get('/api/report/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }, { report: 1 });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.report) return res.status(404).json({ error: 'No report found for this user' });
    res.json({ report: user.report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// ---------------- DAILY TASKS ----------------

app.post('/api/tasks', async (req, res) => {
  const { email, task, time, date, completed } = req.body;
  if (!email || !task || !date) return res.status(400).json({ error: 'Missing task data' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const existing = user.dailyTasks.find(t =>
      t.task === task && t.date.getTime() === taskDate.getTime()
    );

    if (existing) {
      await User.updateOne(
        { email, 'dailyTasks._id': existing._id },
        {
          $set: {
            'dailyTasks.$.completed': completed,
            'dailyTasks.$.time': time,
          },
        }
      );
    } else {
      await User.updateOne(
        { email },
        {
          $push: {
            dailyTasks: { task, time, completed, date: taskDate },
          },
        }
      );
    }

    res.json({ message: 'Task saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save task' });
  }
});

// Get grouped completed tasks by date
app.get('/api/tasks/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const grouped = {};
    let xp = 0;
    let streak = 0;

    // Group tasks by date
    user.dailyTasks
      .filter(t => t.completed)
      .forEach(task => {
        const dateKey = task.date.toISOString().split("T")[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push({
          task: task.task,
          time: task.time,
          completed: task.completed,
        });
        xp += 10; // 10 XP per completed task
      });

    // Calculate streak (consecutive days with completed tasks)
    const sortedDates = Object.keys(grouped).sort();
    for (let i = sortedDates.length - 1; i >= 1; i--) {
      const today = new Date(sortedDates[i]);
      const prev = new Date(sortedDates[i - 1]);
      const diff = (today - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    if (sortedDates.length > 0) streak += 1; // at least today counts

    res.json({
      groupedTasks: grouped,
      xp,
      streak,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Delete task endpoint (moved out of GET route)
app.delete('/api/tasks', async (req, res) => {
  const { email, task, date } = req.body;
  if (!email || !task || !date) return res.status(400).json({ error: 'Missing task data' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    // Find and remove the task
    const taskIndex = user.dailyTasks.findIndex(t =>
      t.task === task && t.date.getTime() === taskDate.getTime()
    );

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    user.dailyTasks.splice(taskIndex, 1);
    await user.save();

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

const PORT = process.env.PORT || 5000;


// Error handling for server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('Environment check:');
  console.log('- Google API Key present:', !!process.env.GOOGLE_API_KEY);
  console.log('- MongoDB URI present:', !!process.env.MONGODB_URI);
});
