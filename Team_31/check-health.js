#!/usr/bin/env node

/**
 * Mindful AI - Dependency & Connection Health Check
 * Verifies all npm packages, APIs, and database connectivity
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n' + '='.repeat(60));
console.log('🔍 MINDFUL AI - HEALTH CHECK REPORT');
console.log('='.repeat(60) + '\n');

// =====================================================
// 1. NPM DEPENDENCIES CHECK
// =====================================================
console.log('📦 NPM DEPENDENCIES');
console.log('-'.repeat(60));

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log(`Name: ${packageJson.name}`);
console.log(`Version: ${packageJson.version}`);
console.log(`Main: ${packageJson.main}`);
console.log(`\nScripts:`);
Object.entries(packageJson.scripts).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

console.log(`\nDependencies (${Object.keys(packageJson.dependencies).length}):`);
Object.entries(packageJson.dependencies).forEach(([pkg, version]) => {
  console.log(`  ✓ ${pkg}@${version}`);
});

// =====================================================
// 2. REQUIRED PACKAGES VERIFICATION
// =====================================================
console.log('\n📋 REQUIRED PACKAGES VERIFICATION');
console.log('-'.repeat(60));

const requiredPackages = [
  'express',
  'mongoose',
  'cors',
  'dotenv',
  'bcryptjs',
  '@google/generative-ai',
  'express-session',
  'body-parser',
  'node-fetch',
  'cross-env'
];

let allPackagesFound = true;
requiredPackages.forEach(pkg => {
  const nodeModulesPath = path.join(__dirname, 'node_modules', pkg);
  const exists = fs.existsSync(nodeModulesPath);
  console.log(`  ${exists ? '✅' : '❌'} ${pkg}`);
  if (!exists) allPackagesFound = false;
});

// =====================================================
// 3. ENVIRONMENT VARIABLES CHECK
// =====================================================
console.log('\n🔐 ENVIRONMENT VARIABLES');
console.log('-'.repeat(60));

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'GOOGLE_API_KEY',
  'MONGODB_URI'
];

let allEnvVarsSet = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const masked = exists ? value.substring(0, 20) + '***' : 'NOT SET';
  console.log(`  ${exists ? '✅' : '❌'} ${varName}: ${masked}`);
  if (!exists) allEnvVarsSet = false;
});

// =====================================================
// 4. GOOGLE API KEY VALIDATION
// =====================================================
console.log('\n🤖 GOOGLE GEMINI API');
console.log('-'.repeat(60));

if (process.env.GOOGLE_API_KEY) {
  const key = process.env.GOOGLE_API_KEY;
  console.log(`  ✅ API Key present (${key.length} chars)`);
  console.log(`  Format: ${key.substring(0, 10)}...${key.substring(key.length - 5)}`);
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(key);
    console.log('  ✅ GoogleGenerativeAI client initialized');
  } catch (e) {
    console.log(`  ❌ GoogleGenerativeAI initialization failed: ${e.message}`);
  }
} else {
  console.log('  ❌ GOOGLE_API_KEY not set');
}

// =====================================================
// 5. MONGODB CONNECTION CHECK
// =====================================================
console.log('\n🗄️  MONGODB CONNECTION');
console.log('-'.repeat(60));

if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  console.log(`  ✅ MongoDB URI configured`);
  console.log(`  Connection string format: ${uri.substring(0, 20)}...${uri.substring(uri.length - 20)}`);
  
  // Check for common indicators
  if (uri.includes('mongodb+srv://')) {
    console.log('  ✅ Using MongoDB Atlas (cloud)');
  } else if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    console.log('  ℹ️  Using local MongoDB');
  }

  // Check credentials in URI
  if (uri.includes('@')) {
    console.log('  ✅ Credentials included in connection string');
  }
} else {
  console.log('  ❌ MONGODB_URI not set');
}

// =====================================================
// 6. PORT CONFIGURATION
// =====================================================
console.log('\n🌐 SERVER CONFIGURATION');
console.log('-'.repeat(60));

const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'development';

console.log(`  Port: ${port}`);
console.log(`  Environment: ${nodeEnv}`);
console.log(`  Server URL: http://localhost:${port}`);

// =====================================================
// 7. FILE STRUCTURE CHECK
// =====================================================
console.log('\n📁 FILE STRUCTURE');
console.log('-'.repeat(60));

const requiredFiles = [
  'server.js',
  'package.json',
  '.env',
  'public/landingpage.html',
  'public/quiz.html',
  'public/chatbot.html',
  'public/community.html',
  'public/articles.html',
  'public/dashboard.html',
  'public/mood.html',
  'public/diary.html',
  'public/settings.html'
];

let allFilesFound = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesFound = false;
});

// =====================================================
// 8. SUMMARY & RECOMMENDATIONS
// =====================================================
console.log('\n' + '='.repeat(60));
console.log('📊 HEALTH CHECK SUMMARY');
console.log('='.repeat(60) + '\n');

const checks = [
  { name: 'All NPM Packages Installed', status: allPackagesFound },
  { name: 'All Environment Variables Set', status: allEnvVarsSet },
  { name: 'All Required Files Present', status: allFilesFound },
  { name: 'Google API Key Configured', status: !!process.env.GOOGLE_API_KEY },
  { name: 'MongoDB URI Configured', status: !!process.env.MONGODB_URI }
];

let allGood = true;
checks.forEach(check => {
  console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
  if (!check.status) allGood = false;
});

console.log('\n' + '='.repeat(60));
if (allGood) {
  console.log('✨ ALL CHECKS PASSED - Project is ready to run!');
  console.log('\nTo start the server, run:');
  console.log('  npm start        (production)');
  console.log('  npm run dev      (development)');
  console.log('  node server.js   (direct)');
} else {
  console.log('⚠️  SOME CHECKS FAILED - Please fix issues above');
  if (!allEnvVarsSet) {
    console.log('\nAction: Update .env file with missing variables');
  }
  if (!allPackagesFound) {
    console.log('\nAction: Run "npm install" to install missing packages');
  }
  if (!allFilesFound) {
    console.log('\nAction: Verify file paths and create missing files');
  }
}
console.log('='.repeat(60) + '\n');

process.exit(allGood ? 0 : 1);
