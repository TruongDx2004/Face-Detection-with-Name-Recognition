const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class FaceRecognitionService {
    constructor() {
        this.pythonPath = process.env.PYTHON_PATH || 'python';
        this.scriptsPath = process.cwd(); // Assuming Python scripts are in root
    }

    // Run Python script
    async runPythonScript(scriptName, args = []) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(this.scriptsPath, scriptName);
            const child = spawn(this.pythonPath, [scriptPath, ...args]);
            
            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, output: stdout });
                } else {
                    reject(new Error(`Python script failed: ${stderr || stdout}`));
                }
            });

            child.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }

    // Create dataset from video
    async createDatasetFromVideo(videoPath, userId) {
        try {
            const result = await this.runPythonScript('01_face_dataset.py', [
                '--video', videoPath,
                '--user-id', userId.toString(),
                '--output-dir', 'dataset'
            ]);
            return result;
        } catch (error) {
            throw new Error(`Dataset creation failed: ${error.message}`);
        }
    }

    // Train face model
    async trainFaceModel() {
        try {
            const result = await this.runPythonScript('02_face_training.py');
            return result;
        } catch (error) {
            throw new Error(`Face training failed: ${error.message}`);
        }
    }

    // Recognize face from image
    async recognizeFace(imagePath) {
        try {
            const result = await this.runPythonScript('03_face_recognition.py', [
                '--image', imagePath,
                '--model', 'trainer/trainer.yml'
            ]);
            
            // Parse result (assuming Python script returns JSON)
            const output = JSON.parse(result.output);
            return output;
        } catch (error) {
            throw new Error(`Face recognition failed: ${error.message}`);
        }
    }

    // Check if model exists and is trained
    async isModelTrained() {
        try {
            await fs.access('trainer/trainer.yml');
            return true;
        } catch {
            return false;
        }
    }

    // Get dataset statistics
    async getDatasetStats() {
        try {
            const files = await fs.readdir('dataset');
            const userStats = {};
            
            for (const file of files) {
                if (file.endsWith('.jpg')) {
                    const parts = file.split('.');
                    if (parts.length >= 3) {
                        const userId = parts[1];
                        userStats[userId] = (userStats[userId] || 0) + 1;
                    }
                }
            }
            
            return userStats;
        } catch (error) {
            return {};
        }
    }
}

module.exports = new FaceRecognitionService();