#!/usr/bin/env node

/**
 * Test script for Advanced Quiz Generation
 * Run this to verify that the Python integration is working correctly
 */

const advancedQuizService = require('../services/advancedQuizService');
const path = require('path');

async function testQuizGeneration() {
    console.log('🧪 Testing Advanced Quiz Generation System...\n');

    try {
        // Test 1: Check Python environment
        console.log('1️⃣ Checking Python environment...');
        const pythonPath = await advancedQuizService.checkPythonEnvironment();
        console.log(`✅ Python found at: ${pythonPath}\n`);

        // Test 2: Get available topics
        console.log('2️⃣ Getting available topics...');
        const topics = await advancedQuizService.getAvailableTopics();
        console.log(`✅ Found ${topics.length} available topics:`, topics.slice(0, 5).join(', '), '...\n');

        // Test 3: Generate cold-start quiz (small test)
        console.log('3️⃣ Testing cold-start quiz generation...');
        console.log('⏳ This may take 30 seconds for web content fetching...');
        
        const testTopics = ['Operating System'];
        const questions = await advancedQuizService.generateColdStartQuiz(testTopics, 3);
        
        console.log(`✅ Generated ${questions.length} questions`);
        if (questions.length > 0) {
            console.log('📝 Sample question:', questions[0].question.substring(0, 100) + '...');
            console.log(`🎯 Difficulty: ${questions[0].difficulty}, Topic: ${questions[0].topic}\n`);
        }

        // Test 4: Test adaptive quiz generation
        console.log('4️⃣ Testing adaptive quiz generation...');
        const studentPerf = {
            topic: {
                'Operating System': { accuracy: 0.4, seen: 5 }
            }
        };
        
        const adaptiveQuestions = await advancedQuizService.generateAdaptiveQuiz(
            questions, 
            studentPerf, 
            2, 
            [0.3, 0.5, 0.2]
        );
        
        console.log(`✅ Generated ${adaptiveQuestions.length} adaptive questions\n`);

        // Test 5: Test study plan generation
        console.log('5️⃣ Testing study plan generation...');
        const studyPlan = await advancedQuizService.generateStudyPlan(
            studentPerf, 
            8, 
            40, 
            1
        );
        
        console.log(`✅ Generated ${studyPlan.length} study plan items`);
        if (studyPlan.length > 0) {
            console.log('📅 Sample task:', studyPlan[0].task);
        }

        console.log('\n🎉 All tests passed! Your advanced quiz generation system is working correctly.');
        console.log('\n📋 Next steps:');
        console.log('1. Start your Node.js server: npm start');
        console.log('2. Visit: http://localhost:5000/api/quiz/advanced');
        console.log('3. Try generating a cold-start quiz for any topic');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        
        if (error.message.includes('Python')) {
            console.log('• Make sure Python is installed and accessible');
            console.log('• Check that the virtual environment is set up correctly');
            console.log('• Verify the Python path in advancedQuizService.js');
        }
        
        if (error.message.includes('model') || error.message.includes('transformers')) {
            console.log('• Ensure you have internet connection for model downloads');
            console.log('• Check available disk space (models need ~330MB)');
            console.log('• Try running the Python script directly to debug');
        }
        
        if (error.message.includes('permission') || error.message.includes('access')) {
            console.log('• Check file permissions');
            console.log('• Ensure the services directory is accessible');
            console.log('• Try running with appropriate permissions');
        }
        
        console.log('\n📖 For detailed setup instructions, see: scripts/setup_advanced_quiz.md');
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testQuizGeneration();
}

module.exports = testQuizGeneration;
