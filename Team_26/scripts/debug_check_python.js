// scripts/debug_check_python.js
// Simple helper to print the Python path resolved by advancedQuizService

(async function(){
  try {
    const path = require('path');
    const fs = require('fs');
    const service = require('../services/advancedQuizService');
    const venvPath = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');
    console.log('EXPECTED_VENV_PATH:', venvPath, 'exists?', fs.existsSync(venvPath));
    console.log('About to call service.checkPythonEnvironment()...');
    try {
      const p = await service.checkPythonEnvironment();
      console.log('RESOLVED_PYTHON_PATH:', p);
    } catch (err) {
      console.error('service.checkPythonEnvironment threw:', err && err.message ? err.message : err);
    }
  } catch (e) {
    console.error('ERROR:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
