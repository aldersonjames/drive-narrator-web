#!/usr/bin/env node

/**
 * Test the Cursor Command System
 */

const CursorCommandHandler = require('./cursor-command-handler');

const handler = new CursorCommandHandler();

console.log('🧪 Testing Cursor Command System\n');

// Test commands
const testCommands = [
  '/help',
  '/plan',
  '/status', 
  '/act',
  '/exit',
  '/plan',
  '/exit'
];

testCommands.forEach((cmd, index) => {
  console.log(`\n--- Test ${index + 1}: ${cmd} ---`);
  const result = handler.handleCommand(cmd);
  console.log(result.response);
  console.log(`Success: ${result.success}`);
  console.log(`Current Mode: ${result.mode || handler.getCurrentState().mode}`);
});

console.log('\n✅ Command system test completed');
