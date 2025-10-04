#!/usr/bin/env node

/**
 * Cursor Mode Wrapper
 * 
 * Simple wrapper for the Cursor command system.
 * Usage: node cursor-mode.js [command]
 */

const CursorIntegration = require('./cursor-integration');

// Get command from arguments
const command = process.argv.slice(2).join(' ');

if (!command) {
  console.log(`
🎯 Cursor Mode System

Usage: node cursor-mode.js [command]

Available Commands:
  /plan     - Enter planning mode (no code execution)
  /act      - Enter acting mode (code execution allowed)
  /status   - Enter status mode (read-only)
  /test     - Enter testing mode (run tests only)
  /deploy   - Enter deployment mode (deploy only)
  /exit     - Return to neutral mode
  /help     - Show help

Examples:
  node cursor-mode.js /plan
  node cursor-mode.js /act
  node cursor-mode.js /exit
`);
  process.exit(0);
}

// Process the command
const integration = new CursorIntegration();
const result = integration.processCommand(command);

console.log(result.response);

if (!result.success) {
  process.exit(1);
}
