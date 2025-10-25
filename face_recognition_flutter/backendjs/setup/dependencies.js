/**
 * Dependencies management module
 * 
 * Handles NPM package installation and validation
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');
const logger = require('./logger');

class DependencyManager {
    constructor() {
        this.isWindows = process.platform === 'win32';
        this.npmCommand = this.isWindows ? 'npm.cmd' : 'npm';
    }

    /**
     * Run npm command with proper platform handling
     */
    runCommand(command, args, options = {}) {
        return new Promise((resolve, reject) => {
            const actualCommand = this.isWindows && !command.endsWith('.cmd') ? `${command}.cmd` : command;
            
            logger.printDebug(`Running: ${actualCommand} ${args.join(' ')}`);
            
            const child = spawn(actualCommand, args, {
                stdio: options.silent ? 'pipe' : 'inherit',
                shell: true,
                cwd: options.cwd || process.cwd(),
                ...options
            });

            let stdout = '';
            let stderr = '';

            if (options.silent) {
                child.stdout?.on('data', (data) => {
                    stdout += data.toString();
                });

                child.stderr?.on('data', (data) => {
                    stderr += data.toString();
                });
            }

            child.on('error', (error) => {
                logger.printError(`Command failed: ${error.message}`);
                reject(error);
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    const error = new Error(`${command} exited with code ${code}`);
                    error.stdout = stdout;
                    error.stderr = stderr;
                    reject(error);
                }
            });
        });
    }

    /**
     * Check if package.json exists and create if needed
     */
    async ensurePackageJson() {
        try {
            await fs.access('package.json');
            logger.printDebug('package.json found');
            return true;
        } catch {
            logger.printInfo('Creating package.json...');
            await this.runCommand(this.npmCommand, ['init', '-y'], { silent: true });
            logger.printSuccess('package.json created');
            return true;
        }
    }

    /**
     * Update package.json with project-specific configuration
     */
    async updatePackageJson(options = {}) {
        try {
            logger.printInfo('Updating package.json configuration...');
            
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));

            // Update basic info
            packageJson.name = packageJson.name || 'face-attendance-backend';
            packageJson.version = packageJson.version || '1.0.0';
            packageJson.description = 'Face Recognition Attendance System Backend';
            packageJson.main = 'src/server.js';
            packageJson.type = 'commonjs';

            // Update scripts
            packageJson.scripts = {
                ...packageJson.scripts,
                "start": "node src/server.js",
                "dev": "nodemon src/server.js",
                "test": "jest",
                "test:watch": "jest --watch",
                "setup": "node setup_server_new.js",
                "setup:reset": "node setup_server_new.js --reset",
                "setup:dev": "node setup_server_new.js --dev",
                "lint": "eslint src/",
                "lint:fix": "eslint src/ --fix",
                "format": "prettier --write src/",
                "migrate": "node migrations/run.js",
                "seed": "node seeds/run.js"
            };

            // Add engines requirement
            packageJson.engines = {
                "node": ">=14.0.0",
                "npm": ">=6.0.0"
            };

            // Add keywords
            packageJson.keywords = [
                "face-recognition",
                "attendance",
                "express",
                "mysql",
                "nodejs"
            ];

            // Add author and license
            packageJson.author = packageJson.author || "Face Attendance Team";
            packageJson.license = packageJson.license || "MIT";

            // Add jest configuration
            packageJson.jest = {
                testEnvironment: "node",
                collectCoverageFrom: [
                    "src/**/*.js",
                    "!src/server.js"
                ],
                testMatch: [
                    "**/__tests__/**/*.js",
                    "**/?(*.)+(spec|test).js"
                ]
            };

            await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
            logger.printSuccess('package.json updated');
            
        } catch (error) {
            logger.printError(`Failed to update package.json: ${error.message}`);
            throw error;
        }
    }

    /**
     * Install production dependencies
     */
    async installProductionDependencies() {
        try {
            logger.printStep('INSTALLING PRODUCTION DEPENDENCIES');
            
            const packages = config.DEPENDENCIES.production;
            logger.printInfo(`Installing ${packages.length} production packages...`);
            
            // Install in chunks to avoid memory issues
            const chunkSize = 5;
            for (let i = 0; i < packages.length; i += chunkSize) {
                const chunk = packages.slice(i, i + chunkSize);
                const progress = Math.min(i + chunkSize, packages.length);
                
                logger.printProgress(progress, packages.length, `Installing packages...`);
                
                await this.runCommand(this.npmCommand, ['install', ...chunk], { silent: true });
            }
            
            logger.printSuccess(`Installed ${packages.length} production dependencies`);
            return true;
            
        } catch (error) {
            logger.printError(`Production dependency installation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Install development dependencies
     */
    async installDevelopmentDependencies() {
        try {
            logger.printStep('INSTALLING DEVELOPMENT DEPENDENCIES');
            
            const packages = config.DEPENDENCIES.development;
            logger.printInfo(`Installing ${packages.length} development packages...`);
            
            await this.runCommand(this.npmCommand, ['install', '--save-dev', ...packages], { silent: true });
            
            logger.printSuccess(`Installed ${packages.length} development dependencies`);
            return true;
            
        } catch (error) {
            logger.printError(`Development dependency installation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify installed packages
     */
    async verifyDependencies() {
        try {
            logger.printInfo('Verifying installed dependencies...');
            
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            // Only check essential packages for basic functionality
            const essentialPackages = [
                'express',
                'mysql2',
                'bcrypt',
                'jsonwebtoken',
                'cors',
                'dotenv',
                'helmet',
                'morgan',
                'axios'
            ];

            const missingPackages = [];
            
            for (const pkg of essentialPackages) {
                if (!dependencies[pkg]) {
                    missingPackages.push(pkg);
                }
            }

            if (missingPackages.length > 0) {
                logger.printWarning(`Missing essential packages: ${missingPackages.join(', ')}`);
                logger.printInfo('Installing missing packages...');
                
                // Try to install missing packages
                try {
                    await this.runCommand(this.npmCommand, ['install', ...missingPackages], { silent: true });
                    logger.printSuccess('Missing packages installed successfully');
                } catch (installError) {
                    logger.printError(`Failed to install missing packages: ${installError.message}`);
                    return false;
                }
            }

            // Check if we have most packages installed
            const totalExpected = config.DEPENDENCIES.production.length;
            const installedCount = config.DEPENDENCIES.production
                .map(pkg => pkg.split('@')[0])
                .filter(pkg => dependencies[pkg]).length;
            
            const coveragePercent = Math.round((installedCount / totalExpected) * 100);
            
            if (coveragePercent >= 80) {
                logger.printSuccess(`Dependencies verified (${installedCount}/${totalExpected} packages, ${coveragePercent}% coverage)`);
                return true;
            } else {
                logger.printWarning(`Low package coverage: ${coveragePercent}%`);
                return false;
            }
            
        } catch (error) {
            logger.printError(`Dependency verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Check for security vulnerabilities
     */
    async auditSecurity() {
        try {
            logger.printInfo('Running security audit...');
            
            const result = await this.runCommand(this.npmCommand, ['audit', '--json'], { silent: true });
            const audit = JSON.parse(result.stdout);
            
            if (audit.metadata.vulnerabilities.total > 0) {
                const { high, critical } = audit.metadata.vulnerabilities;
                
                if (critical > 0 || high > 0) {
                    logger.printWarning(`Security vulnerabilities found: ${critical} critical, ${high} high`);
                    logger.printInfo('Run "npm audit fix" to attempt automatic fixes');
                } else {
                    logger.printInfo(`Minor security issues found: ${audit.metadata.vulnerabilities.total} total`);
                }
            } else {
                logger.printSuccess('No security vulnerabilities found');
            }
            
            return true;
            
        } catch (error) {
            logger.printWarning(`Security audit failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Update outdated packages
     */
    async updatePackages() {
        try {
            logger.printInfo('Checking for package updates...');
            
            const result = await this.runCommand(this.npmCommand, ['outdated', '--json'], { silent: true });
            
            if (result.stdout.trim()) {
                const outdated = JSON.parse(result.stdout);
                const count = Object.keys(outdated).length;
                
                if (count > 0) {
                    logger.printInfo(`Found ${count} outdated packages`);
                    logger.printInfo('Run "npm update" to update packages');
                } else {
                    logger.printSuccess('All packages are up to date');
                }
            } else {
                logger.printSuccess('All packages are up to date');
            }
            
            return true;
            
        } catch (error) {
            // npm outdated returns exit code 1 when outdated packages exist
            if (error.stdout) {
                try {
                    const outdated = JSON.parse(error.stdout);
                    const count = Object.keys(outdated).length;
                    logger.printInfo(`Found ${count} outdated packages`);
                } catch {
                    logger.printDebug('Could not parse outdated packages output');
                }
            }
            return true;
        }
    }

    /**
     * Clean npm cache and node_modules
     */
    async cleanCache() {
        try {
            logger.printInfo('Cleaning npm cache...');
            
            // Clean npm cache
            await this.runCommand(this.npmCommand, ['cache', 'clean', '--force'], { silent: true });
            
            // Remove node_modules if exists
            try {
                await fs.rmdir('node_modules', { recursive: true });
                logger.printDebug('Removed existing node_modules');
            } catch {
                // node_modules might not exist
            }
            
            logger.printSuccess('Cache cleaned');
            return true;
            
        } catch (error) {
            logger.printWarning(`Cache cleaning failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Install global dependencies if needed
     */
    async installGlobalDependencies() {
        const globalPackages = ['nodemon', 'pm2'];
        const installedGlobals = [];
        
        for (const pkg of globalPackages) {
            try {
                await this.runCommand(this.npmCommand, ['list', '-g', pkg], { silent: true });
                installedGlobals.push(pkg);
            } catch {
                // Package not installed globally
            }
        }
        
        const missing = globalPackages.filter(pkg => !installedGlobals.includes(pkg));
        
        if (missing.length > 0) {
            logger.printInfo(`Recommended global packages not found: ${missing.join(', ')}`);
            logger.printInfo('Install them with: npm install -g ' + missing.join(' '));
        } else {
            logger.printSuccess('All recommended global packages are installed');
        }
    }

    /**
     * Main setup method
     */
    async setup(options = {}) {
        try {
            logger.printStep('SETTING UP DEPENDENCIES');
            
            // Ensure package.json exists
            await this.ensurePackageJson();
            
            // Update package.json with project configuration
            await this.updatePackageJson(options);
            
            // Clean cache if requested
            if (options.reset) {
                await this.cleanCache();
            }
            
            // Install production dependencies
            await this.installProductionDependencies();
            
            // Install development dependencies in dev mode
            if (options.dev || config.isDevelopment) {
                await this.installDevelopmentDependencies();
            }
            
            // Verify installation
            const verified = await this.verifyDependencies();
            if (!verified) {
                throw new Error('Dependency verification failed');
            }
            
            // Security audit
            await this.auditSecurity();
            
            // Check for updates
            await this.updatePackages();
            
            // Check global dependencies
            await this.installGlobalDependencies();
            
            logger.printSuccess('Dependency setup completed successfully');
            return true;
            
        } catch (error) {
            logger.printError(`Dependency setup failed: ${error.message}`);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new DependencyManager();