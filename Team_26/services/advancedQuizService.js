const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const Content = require('../models/Content');
const mongoose = require('mongoose');
const fsSync = require('fs');

class AdvancedQuizService {
    constructor() {
        // Use the ML-based advanced generator
        this.pythonScriptPath = path.join(__dirname, 'advanced_quiz_generator.py');
        this.pythonEnvPath = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe'); // Windows venv
        this.fallbackPythonPath = 'python'; // try 'python' then 'python3' later
    }

    /**
     * Check if Python environment is available
     */
    async checkPythonEnvironment() {
        // Try venv python first, then 'python', then 'python3'
        const candidates = [this.pythonEnvPath, 'python', 'python3'];
        for (const candidate of candidates) {
            try {
                // quick existence check for absolute path; otherwise attempt spawn --version
                if (path.isAbsolute(candidate)) {
                    await fs.access(candidate);
                    return candidate;
                }
                // try to spawn candidate --version to see if available
                await new Promise((resolve, reject) => {
                    const p = spawn(candidate, ['--version']);
                    let stderr = '';
                    p.stderr.on('data', d => stderr += d.toString());
                    p.on('error', () => reject(new Error('exec failed')));
                    p.on('close', code => code === 0 ? resolve() : resolve());
                });
                return candidate;
            } catch (e) {
                // try next
            }
        }
        // return fallback
        return this.fallbackPythonPath;
    }

    /**
     * Execute Python script with arguments
     */
    async executePythonScript(pythonPath, args = [], inputData = null) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(pythonPath, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(this.pythonScriptPath)
            });

            let stdout = '';
            let stderr = '';

            if (inputData) {
                try {
                    pythonProcess.stdin.write(JSON.stringify(inputData));
                } catch (e) {
                    // ignore write errors
                }
                pythonProcess.stdin.end();
            }

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }

    /**
     * Generate cold-start quiz from topics
     */
    async generateColdStartQuiz(topics, perTopicQuestions = 8) {
        try {
            console.log('🔍 Generating cold-start quiz (ML) for topics:', topics);

            // Fetch content documents for the requested topics if DB is connected
            let contents = [];
            if (mongoose.connection.readyState === 1) {
                try {
                    contents = await Content.find({ subject: { $in: topics } }).lean();
                } catch (e) {
                    console.warn('Content.find() failed, will attempt local data fallback:', e && e.message ? e.message : e);
                    contents = [];
                }
            } else {
                console.warn('MongoDB not connected (state=' + mongoose.connection.readyState + '), using local data fallback');
            }

            if (!contents || contents.length === 0) {
                // Try to load matching markdown files from data/ as a fallback
                try {
                    const dataDir = path.join(__dirname, '..', 'data');
                    const files = fsSync.readdirSync(dataDir).filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.markdown'));
                    const matches = [];
                    for (const file of files) {
                        const full = path.join(dataDir, file);
                        try {
                            const txt = fsSync.readFileSync(full, { encoding: 'utf8' });
                            // simple match: filename contains topic or content contains topic name
                            for (const t of topics) {
                                const key = t.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
                                if (file.toLowerCase().includes(t.toLowerCase()) || txt.toLowerCase().includes(key)) {
                                    matches.push({ transcript: txt, chunks: txt.split(/\n\n+/) });
                                    break;
                                }
                            }
                        } catch (e) {
                            // ignore file read errors
                        }
                    }
                    if (matches.length) contents = matches;
                } catch (e) {
                    console.warn('Local data fallback failed:', e && e.message ? e.message : e);
                }
            }

            // Build a single aggregated text payload from transcripts/chunks/description
            const combined = contents.map(c => c.transcript || (c.chunks && c.chunks.join(' ')) || c.description || '').join('\n\n');
            const payload = { transcript: combined, chunks: contents.flatMap(c => c.chunks || []) };

            const pythonPath = await this.checkPythonEnvironment();
            process.env.PYTHONUTF8 = '1';
            process.env.PYTHONIOENCODING = 'utf-8';

            // Ask generator for up to topics.length * perTopicQuestions (cap to reasonable limit)
            const maxQs = Math.min(200, Math.max(perTopicQuestions * topics.length, perTopicQuestions));
            const { stdout, stderr } = await this.executePythonScript(pythonPath, [this.pythonScriptPath, '--max', String(maxQs)], payload);
            if (stderr && stderr.trim()) console.warn('advanced_quiz_generator stderr:', stderr.trim());

            let parsed = [];
            try {
                parsed = JSON.parse(stdout.trim() || '[]');
            } catch (e) {
                console.error('Failed to parse generator output:', e.message);
                console.error('Generator stdout:', stdout);
                // fallback
                const fallback = [];
                for (const t of topics) fallback.push(...this._generateEnhancedQuestions(t, perTopicQuestions));
                return fallback;
            }

            // Map generator format to our expected schema and filter by confidence
            const questions = parsed.map(q => ({
                question: q.stem || q.question || q.prompt || '',
                options: q.options || q.choices || [],
                correctAnswer: (q.options && typeof q.correctIndex === 'number') ? (q.options[q.correctIndex] || q.options[0]) : q.correctAnswer || (q.options && q.options[0]) || null,
                difficulty: q.difficulty || 'medium',
                topic: topics.length === 1 ? topics[0] : (q.topic || topics[0]),
                subtopic: q.subtopic || null,
                skill: q.skill || 'understand',
                source: q.generatedBy || 'advanced_quiz_generator.py',
                confidence: typeof q.confidence === 'number' ? q.confidence : 0.5
            })).filter(q => q.question && q.options && q.options.length >= 2 && q.confidence >= 0.3);

            // If not enough questions, pad with enhanced templates
            if (questions.length < perTopicQuestions * topics.length) {
                console.warn(`Generator returned ${questions.length} questions, expected ${perTopicQuestions * topics.length}. Padding with templates.`);
                for (const t of topics) {
                    const needed = Math.max(0, perTopicQuestions - questions.filter(x => x.topic === t).length);
                    if (needed > 0) questions.push(...this._generateEnhancedQuestions(t, needed));
                }
            }

            // Trim to requested count (distribute across topics if multiple)
            const final = questions.slice(0, perTopicQuestions * topics.length);
            console.log(`✅ Generated ${final.length} ML questions for topics: ${topics}`);
            return final;
        } catch (error) {
            console.error('❌ Error generating cold-start quiz (ML):', error && error.stack ? error.stack : error);
            // fallback to templates
            const fallback = [];
            for (const t of topics) fallback.push(...this._generateEnhancedQuestions(t, perTopicQuestions));
            return fallback;
        }
    }

    /**
     * Generate enhanced fallback questions (better than simple fallback)
     */
    _generateEnhancedQuestions(topic, count) {
        const enhancedQuestions = [];
        
        // Comprehensive topic-specific question templates
        const templates = {
            'Artificial Intelligence': [
                {
                    question: `What is the primary goal of machine learning in artificial intelligence?`,
                    options: [
                        'To enable computers to learn from data without explicit programming',
                        'To replace human intelligence completely',
                        'To make computers faster than humans',
                        'To eliminate the need for data'
                    ],
                    correctAnswer: 'To enable computers to learn from data without explicit programming',
                    difficulty: 'medium',
                    skill: 'understand'
                },
                {
                    question: `Which algorithm is most commonly used for classification in machine learning?`,
                    options: [
                        'Support Vector Machine (SVM)',
                        'Bubble Sort',
                        'Binary Search',
                        'Quick Sort'
                    ],
                    correctAnswer: 'Support Vector Machine (SVM)',
                    difficulty: 'medium',
                    skill: 'remember'
                },
                {
                    question: `How does supervised learning differ from unsupervised learning?`,
                    options: [
                        'Supervised learning uses labeled data, unsupervised learning finds patterns in unlabeled data',
                        'Supervised learning is faster than unsupervised learning',
                        'Supervised learning requires more computational power',
                        'There is no difference between them'
                    ],
                    correctAnswer: 'Supervised learning uses labeled data, unsupervised learning finds patterns in unlabeled data',
                    difficulty: 'medium',
                    skill: 'analyze'
                },
                {
                    question: `What is the purpose of feature selection in machine learning?`,
                    options: [
                        'To reduce dimensionality and improve model performance',
                        'To increase the number of data points',
                        'To make the algorithm run faster',
                        'To reduce computational complexity'
                    ],
                    correctAnswer: 'To reduce dimensionality and improve model performance',
                    difficulty: 'medium',
                    skill: 'understand'
                },
                {
                    question: `Which neural network architecture is best for image recognition?`,
                    options: [
                        'Convolutional Neural Network (CNN)',
                        'Recurrent Neural Network (RNN)',
                        'Feedforward Neural Network',
                        'Radial Basis Function Network'
                    ],
                    correctAnswer: 'Convolutional Neural Network (CNN)',
                    difficulty: 'medium',
                    skill: 'apply'
                }
            ],
            'Data Structures': [
                {
                    question: `What is the time complexity of inserting an element in a binary search tree?`,
                    options: [
                        'O(log n)',
                        'O(n)',
                        'O(1)',
                        'O(n²)'
                    ],
                    correctAnswer: 'O(log n)',
                    difficulty: 'medium',
                    skill: 'understand'
                },
                {
                    question: `Which data structure is best for implementing a queue?`,
                    options: [
                        'Linked List',
                        'Array',
                        'Stack',
                        'Tree'
                    ],
                    correctAnswer: 'Linked List',
                    difficulty: 'medium',
                    skill: 'apply'
                },
                {
                    question: `What is the main advantage of using a hash table?`,
                    options: [
                        'Average O(1) time complexity for search, insert, and delete',
                        'Guaranteed sorted order',
                        'Memory efficiency',
                        'Easy to implement'
                    ],
                    correctAnswer: 'Average O(1) time complexity for search, insert, and delete',
                    difficulty: 'medium',
                    skill: 'understand'
                }
            ],
            'Computer Networks': [
                {
                    question: `What is the purpose of the OSI model in computer networking?`,
                    options: [
                        'To standardize network communication protocols',
                        'To increase network speed',
                        'To reduce network costs',
                        'To simplify network hardware'
                    ],
                    correctAnswer: 'To standardize network communication protocols',
                    difficulty: 'medium',
                    skill: 'understand'
                },
                {
                    question: `Which protocol is used for reliable data transmission over the internet?`,
                    options: [
                        'TCP (Transmission Control Protocol)',
                        'UDP (User Datagram Protocol)',
                        'HTTP (Hypertext Transfer Protocol)',
                        'FTP (File Transfer Protocol)'
                    ],
                    correctAnswer: 'TCP (Transmission Control Protocol)',
                    difficulty: 'medium',
                    skill: 'remember'
                }
            ],
            'Cybersecurity': [
                {
                    question: `What is the primary purpose of encryption in cybersecurity?`,
                    options: [
                        'To protect data confidentiality and integrity',
                        'To increase data transmission speed',
                        'To reduce storage requirements',
                        'To simplify data processing'
                    ],
                    correctAnswer: 'To protect data confidentiality and integrity',
                    difficulty: 'medium',
                    skill: 'understand'
                },
                {
                    question: `Which type of attack involves flooding a network with traffic?`,
                    options: [
                        'DDoS (Distributed Denial of Service)',
                        'Phishing',
                        'SQL Injection',
                        'Man-in-the-middle attack'
                    ],
                    correctAnswer: 'DDoS (Distributed Denial of Service)',
                    difficulty: 'medium',
                    skill: 'remember'
                }
            ]
        };

        const topicTemplates = templates[topic] || [
            {
                question: `What is a key concept in ${topic}?`,
                options: [
                    `${topic} fundamental principle`,
                    `${topic} advanced technique`,
                    `${topic} basic method`,
                    `${topic} complex algorithm`
                ],
                correctAnswer: `${topic} fundamental principle`,
                difficulty: 'medium',
                skill: 'understand'      }
        ];

        for (let i = 0; i < count; i++) {
            const template = topicTemplates[i % topicTemplates.length];
            enhancedQuestions.push({
                question: template.question,
                options: template.options,
                correctAnswer: template.correctAnswer,
                difficulty: template.difficulty,
                topic: topic,
                subtopic: topic,
                skill: template.skill,
                source: 'enhanced_fallback'
            });
        }

        return enhancedQuestions;
    }

    /**
     * Generate adaptive quiz based on student performance
     */
    async generateAdaptiveQuiz(mcqBank, studentPerformance, totalQuestions = 12, difficultyMix = [0.3, 0.5, 0.2]) {
        try {
            console.log('🧠 Generating adaptive quiz (ML-backed) based on student performance');

            // If we have an existing MCQ bank, use it as a base; otherwise generate fresh pool from content
            let pool = Array.isArray(mcqBank) ? mcqBank.slice() : [];
            if (pool.length < totalQuestions) {
                // Attempt to build pool from content for subjects found in mcqBank or from studentPerformance topics
                const topics = Object.keys(studentPerformance.topic || {});
                // fallback to a generic topic if none
                const seedTopics = topics.length ? topics : ['General'];
                const fresh = await this.generateColdStartQuiz(seedTopics, Math.max(totalQuestions, 20));
                pool = pool.concat(fresh);
            }

            // Simple selection strategy: prefer higher-confidence and vary difficulty
            // Normalize confidence (if missing assume 0.5)
            pool = pool.map(q => ({ ...q, confidence: typeof q.confidence === 'number' ? q.confidence : (q.conf || 0.5) }));
            pool.sort((a, b) => b.confidence - a.confidence);

            // Select top N but try to respect difficultyMix (easy, medium, hard)
            const easyCount = Math.round(totalQuestions * difficultyMix[0]);
            const mediumCount = Math.round(totalQuestions * difficultyMix[1]);
            const hardCount = totalQuestions - easyCount - mediumCount;

            const byDifficulty = { easy: [], medium: [], hard: [] };
            pool.forEach(q => {
                const d = (q.difficulty || 'medium').toLowerCase();
                if (d === 'easy') byDifficulty.easy.push(q);
                else if (d === 'hard') byDifficulty.hard.push(q);
                else byDifficulty.medium.push(q);
            });

            const pick = (arr, n) => arr.slice(0, n);
            let selected = [];
            selected = selected.concat(pick(byDifficulty.easy, easyCount));
            selected = selected.concat(pick(byDifficulty.medium, mediumCount));
            selected = selected.concat(pick(byDifficulty.hard, hardCount));

            // If we still don't have enough, top-up from pool
            if (selected.length < totalQuestions) {
                const needed = totalQuestions - selected.length;
                const remaining = pool.filter(p => !selected.includes(p));
                selected = selected.concat(remaining.slice(0, needed));
            }

            // Ensure final size
            selected = selected.slice(0, totalQuestions);

            console.log(`✅ Selected ${selected.length} adaptive questions (confidence-ranked)`);
            return selected;
        } catch (error) {
            console.error('❌ Error generating adaptive quiz (ML):', error && error.stack ? error.stack : error);
            throw error;
        }
    }

    /**
     * Generate study plan based on student performance
     */
    async generateStudyPlan(studentPerformance, hoursPerWeek = 8, blockMinutes = 40, horizonWeeks = 2) {
        try {
            console.log('📅 Generating study plan');
            
            // This is a simplified version - in a real implementation, you might want to call Python
            // For now, we'll implement the study plan logic in JavaScript
            const topics = Object.keys(studentPerformance.topic || {});
            if (!topics.length) return [];

            const blocksPerWeek = Math.max(1, Math.floor(hoursPerWeek * 60 / blockMinutes));
            const rankedTopics = topics.sort((a, b) => {
                const accA = studentPerformance.topic[a]?.accuracy || 0.5;
                const accB = studentPerformance.topic[b]?.accuracy || 0.5;
                return accA - accB; // Sort by accuracy (lowest first)
            });

            const plan = [];
            let day = 1;

            for (let w = 0; w < horizonWeeks; w++) {
                for (let b = 0; b < blocksPerWeek; b++) {
                    const topic = rankedTopics[(w * blocksPerWeek + b) % rankedTopics.length];
                    const acc = studentPerformance.topic[topic]?.accuracy || 0.5;
                    
                    let task;
                    if (acc < 0.5) {
                        task = `Learn ${topic}: watch/read + 6 easy MCQs`;
                    } else if (acc < 0.75) {
                        task = `Practice ${topic}: 8 mixed MCQs + error review`;
                    } else {
                        task = `Advance ${topic}: 6 medium/hard MCQs + summary notes`;
                    }

                    plan.push({
                        day: day,
                        topic: topic,
                        task: task,
                        priority: acc < 0.5 ? 'high' : acc < 0.75 ? 'medium' : 'low'
                    });

                    // Add spaced repetition reviews
                    [2, 5, 10].forEach(offset => {
                        if (day + offset <= horizonWeeks * 7) {
                            plan.push({
                                day: day + offset,
                                topic: topic,
                                task: `Review ${topic}: SRS 10 cards`,
                                priority: 'low'
                            });
                        }
                    });

                    day++;
                }
            }

            return plan.filter(item => item.day <= horizonWeeks * 7)
                      .sort((a, b) => a.day - b.day);

        } catch (error) {
            console.error('❌ Error generating study plan:', error);
            throw new Error(`Failed to generate study plan: ${error.message}`);
        }
    }

    /**
     * Validate and format questions for database storage
     */
    formatQuestionsForDatabase(questions) {
        return questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            topic: q.topic,
            subtopic: q.subtopic,
            skill: q.skill,
            source: q.source
        }));
    }

    /**
     * Get available topics for quiz generation
     */
    getAvailableTopics() {
        return [
            'Operating System',
            'Database Management System', 
            'Computer Network',
            'Data Structure',
            'Algorithm',
            'Software Engineering',
            'Computer Architecture',
            'Programming Languages',
            'Machine Learning',
            'Artificial Intelligence',
            'Web Development',
            'Mobile Development',
            'Cybersecurity',
            'Cloud Computing',
            'DevOps'
        ];
    }
}

module.exports = new AdvancedQuizService(); 