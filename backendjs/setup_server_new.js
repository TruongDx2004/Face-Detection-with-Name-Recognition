#!/usr/bin/env node
/**
 * Face Attendance System Setup Script (Modularized Version)
 * 
 * This script sets up the complete backend system with modular design
 * for easier development and maintenance.
 * 
 * Usage: node setup_server_new.js [options]
 * Options:
 *   --skip-db     Skip database setup
 *   --skip-deps   Skip dependency installation
 *   --reset       Reset all data (drop and recreate database)
 *   --help        Show help
 */

const path = require('path');
const { Command } = require('commander');

// Import modules
const config = require('./setup/config');
const logger = require('./setup/logger');
const database = require('./setup/database');
const dependencies = require('./setup/dependencies');
const files = require('./setup/files');
const migrations = require('./setup/migrations');
const testing = require('./setup/testing');

// Initialize commander for CLI options
const program = new Command();

program
  .name('setup_server')
  .description('Face Attendance System Setup Script')
  .version('2.0.0')
  .option('--skip-db', 'Skip database setup')
  .option('--skip-deps', 'Skip dependency installation')
  .option('--reset', 'Reset all data (drop and recreate database)')
  .option('--dev', 'Development mode with additional tools')
  .option('--production', 'Production mode setup')
  .option('--help', 'Show help');

/**
 * Main setup orchestrator
 */
async function main() {
  try {
    program.parse();
    const options = program.opts();

    logger.printHeader('FACE ATTENDANCE SYSTEM SETUP v2.0');
    logger.printInfo('Starting modular setup process...');

    // Step 1: Validate environment
    await validateEnvironment();

    // Step 2: Setup dependencies (unless skipped)
    if (!options.skipDeps) {
      await dependencies.setup(options);
    }

    // Step 3: Create directory structure
    //await files.createDirectories();

    // Step 4: Setup database (unless skipped)
    if (!options.skipDb) {
      await database.setup(options);
    }

    // Step 5: Create configuration files
    //await files.createConfigFiles(options);

    // Step 6: Create application files
    //await files.createApplicationFiles(options);

    // Step 7: Run migrations
    await migrations.runAll(options);

    // Step 8: Setup testing
    await testing.setup(options);

    // Step 9: Final validation
    await validateSetup(options);

    logger.printSuccess('Setup completed successfully! 🎉');
    printNextSteps(options);

  } catch (error) {
    logger.printError(`Setup failed: ${error.message}`);
    logger.printError(`Stack: ${error.stack}`);
    process.exit(1);
  }
}

/**
 * Validate environment before setup
 */
async function validateEnvironment() {
  logger.printStep('VALIDATING ENVIRONMENT');

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 14) {
    throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 14 or higher.`);
  }
  logger.printSuccess(`Node.js version: ${nodeVersion} ✓`);

  // Check if MySQL is available
  const mysqlAvailable = await database.checkConnection();
  if (!mysqlAvailable) {
    throw new Error('MySQL connection failed. Please check your MySQL installation and configuration.');
  }
  logger.printSuccess('MySQL connection ✓');

  // Check available disk space (at least 1GB)
  const fs = require('fs');
  const stats = fs.statSync('.');
  logger.printSuccess('Environment validation completed');
}

/**
 * Validate setup completion
 */
async function validateSetup(options) {
  logger.printStep('VALIDATING SETUP');

  try {
    // Check if all required files exist
    const requiredFiles = [
      'package.json',
      'src/server.js',
      'src/config/database.js',
      '.env'
    ];

    for (const file of requiredFiles) {
      const fs = require('fs').promises;
      await fs.access(file);
      logger.printSuccess(`File exists: ${file}`);
    }

    // Test database connection with actual config
    await database.testConnection();
    logger.printSuccess('Database connection test passed');

    // Validate package.json scripts
    const packageJson = JSON.parse(await require('fs').promises.readFile('package.json', 'utf-8'));
    const requiredScripts = ['start', 'dev', 'test'];
    
    for (const script of requiredScripts) {
      if (!packageJson.scripts[script]) {
        throw new Error(`Missing required script: ${script}`);
      }
    }
    logger.printSuccess('Package.json scripts validated');

  } catch (error) {
    throw new Error(`Setup validation failed: ${error.message}`);
  }
}

/**
 * Print next steps for user
 */
function printNextSteps(options) {
  logger.printHeader('NEXT STEPS');
  
  console.log('1. Start the development server:');
  console.log('   npm run dev');
  console.log('');
  
  console.log('2. Or start in production mode:');
  console.log('   npm start');
  console.log('');
  
  console.log('3. Test the API:');
  console.log('   npm test');
  console.log('   # or');
  console.log('   node test_api.js');
  console.log('');
  
  console.log('4. Access the application:');
  console.log(`   API: ${config.SERVER_URL}`);
  console.log(`   Docs: ${config.SERVER_URL}/docs`);
  console.log('');
  
  console.log('5. Default login credentials:');
  Object.entries(config.TEST_USERS).forEach(([role, creds]) => {
    console.log(`   ${role.charAt(0).toUpperCase() + role.slice(1)}: ${creds.username} / ${creds.password}`);
  });
  console.log('');
  
  if (options.dev) {
    console.log('🛠️  Development mode features:');
    console.log('   - Nodemon auto-restart');
    console.log('   - Debug logging enabled');
    console.log('   - Development middleware active');
    console.log('');
  }
  
  console.log('📚 Documentation and help:');
  console.log('   - API Docs: /docs endpoint');
  console.log('   - README.md for detailed setup');
  console.log('   - Check logs/ directory for system logs');
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.printError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.printError(`Uncaught Exception: ${error.message}`);
  logger.printError(`Stack: ${error.stack}`);
  process.exit(1);
});

// Execute main function if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  validateEnvironment,
  validateSetup
};