const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class LSTMPredictor {
    constructor() {
        this.pythonPath = 'python';
        this.scriptPath = path.join(__dirname, '..', 'ml_training', 'predict_simple.py');
        this.modelDirs = [
            path.join(__dirname, '..', 'ml_training', 'models')
        ];
    }

    /**
     * Check if a trained model exists for the given symbol
     * @param {string} symbol - Stock symbol (e.g., 'RELIANCE.NS')
     * @returns {Promise<boolean>}
     */
    async hasModel(symbol) {
        for (const dir of this.modelDirs) {
            try {
                const m = path.join(dir, `${symbol}_model.joblib`);
                const s = path.join(dir, `${symbol}_scaler.joblib`);
                const md = path.join(dir, `${symbol}_metadata.json`);
                await fs.access(m);
                await fs.access(s);
                await fs.access(md);
                return true;
            } catch (_) {}
        }
        return false;
    }

    /**
     * Get model metadata
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Object|null>}
     */
    async getModelMetadata(symbol) {
        for (const dir of this.modelDirs) {
            try {
                const p = path.join(dir, `${symbol}_metadata.json`);
                const t = await fs.readFile(p, 'utf8');
                return JSON.parse(t);
            } catch (_) {}
        }
        return null;
    }

    /**
     * Predict future stock prices using trained LSTM model
     * @param {string} symbol - Stock symbol
     * @param {number} days - Number of days to predict (default: 30)
     * @returns {Promise<Object>}
     */
    async predict(symbol, days = 30) {
        return new Promise((resolve, reject) => {
            this.hasModel(symbol).then(async exists => {
                if (!exists) {
                    reject(new Error(`No trained model found for symbol: ${symbol}`));
                    return;
                }
                let dirToUse = this.modelDirs[0];
                for (const d of this.modelDirs) {
                    try {
                        await fs.access(path.join(d, `${symbol}_model.joblib`));
                        dirToUse = d;
                        break;
                    } catch (_) {}
                }
                const args = [this.scriptPath, symbol, days.toString(), dirToUse];
                const pythonProcess = spawn(this.pythonPath, args);
                let stdout = '';
                let stderr = '';
                pythonProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                pythonProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                pythonProcess.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const result = JSON.parse(stdout);
                            resolve(result);
                        } catch (error) {
                            reject(new Error(`Failed to parse prediction result: ${error.message}`));
                        }
                    } else {
                        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                    }
                });
                pythonProcess.on('error', (error) => {
                    reject(new Error(`Failed to start Python process: ${error.message}`));
                });
            }).catch(reject);
        });
    }

    /**
     * Train a new model for the given symbol
     * @param {string} symbol - Stock symbol
     * @param {Object} options - Training options
     * @returns {Promise<Object>}
     */
    async trainModel(symbol, options = {}) {
        return new Promise((resolve, reject) => {
            const trainScript = path.join(__dirname, '..', 'ml_training', 'simple_lstm.py');
            const args = [
                trainScript,
                symbol
            ];

            const pythonProcess = spawn(this.pythonPath, args);

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                // Log training progress
                console.log(`Training ${symbol}:`, data.toString().trim());
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const trimmed = stdout.trim();
                        let parsed;
                        try {
                            parsed = JSON.parse(trimmed);
                        } catch (_) {
                            const start = trimmed.indexOf('{');
                            const end = trimmed.lastIndexOf('}');
                            if (start !== -1 && end !== -1 && end > start) {
                                const jsonStr = trimmed.slice(start, end + 1);
                                parsed = JSON.parse(jsonStr);
                            }
                        }
                        if (parsed) {
                            resolve(parsed);
                        } else {
                            resolve({ success: true, message: 'Training completed' });
                        }
                    } catch (error) {
                        resolve({ success: true, message: 'Training completed' });
                    }
                } else {
                    reject(new Error(`Training failed with code ${code}: ${stderr}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start training process: ${error.message}`));
            });
        });
    }

    /**
     * Get list of available trained models
     * @returns {Promise<Array>}
     */
    async getAvailableModels() {
        try {
            const models = [];
            const seen = new Set();
            for (const dir of this.modelDirs) {
                try {
                    const files = await fs.readdir(dir);
                    for (const file of files) {
                        if (file.endsWith('_metadata.json')) {
                            const symbol = file.replace('_metadata.json', '');
                            if (seen.has(symbol)) continue;
                            const metadata = await this.getModelMetadata(symbol);
                            if (metadata) {
                                models.push({ symbol, ...metadata });
                                seen.add(symbol);
                            }
                        }
                    }
                } catch (_) {}
            }
            return models;
        } catch (error) {
            return [];
        }
    }

    /**
     * Delete a trained model
     * @param {string} symbol - Stock symbol
     * @returns {Promise<boolean>}
     */
    async deleteModel(symbol) {
        try {
            let ok = false;
            for (const dir of this.modelDirs) {
                const paths = [
                    path.join(dir, `${symbol}_model.joblib`),
                    path.join(dir, `${symbol}_scaler.joblib`),
                    path.join(dir, `${symbol}_metadata.json`),
                    path.join(dir, `${symbol}_lstm_model.h5`),
                    path.join(dir, `${symbol}_best_model.h5`),
                    path.join(dir, `${symbol}_scaler.pkl`)
                ];
                await Promise.allSettled(paths.map(p => fs.unlink(p)));
                ok = true;
            }
            return ok;
        } catch (_) {
            return false;
        }
    }
}

module.exports = LSTMPredictor;