#!/usr/bin/env node

/**
 * Drive Narrator Command Runner
 * 
 * Quick command execution for the Drive Narrator spec kit
 * Usage: node run-command.js "@plan voice-conversation high this-week"
 */

const { execSync } = require('child_process');
const path = require('path');

// Get command from command line arguments
const command = process.argv.slice(2).join(' ');

if (!command) {
  console.log(`
🚀 Drive Narrator Command Runner

Usage: node run-command.js "@command [parameters]"

Available commands:
  @plan [feature] [priority] [timeline]     - Plan feature implementation
  @act [task_id] [action] [params]          - Execute specific task
  @status [scope]                           - Get project status
  @test [component] [type]                  - Run tests
  @deploy [env] [scope]                     - Deploy to environment
  @voice-test [voice] [persona] [accent]    - Test voice combination
  @voice-preview [text] [settings]         - Generate voice preview
  @location-track [action] [settings]      - Control location tracking
  @poi-detect [lat] [lng] [radius] [interests] - Detect nearby POIs
  @conversation-start [profile] [drive] [context] - Start conversation
  @drive-start [profile] [settings]        - Start drive session
  @monitor-status [component] [metrics]    - Check system status

Examples:
  node run-command.js "@plan voice-conversation high this-week"
  node run-command.js "@act VR-001 create voice-recognition-component"
  node run-command.js "@voice-test alloy adventure-seeker american"
  node run-command.js "@monitor-status all cpu,memory,response-time"
`);
  process.exit(0);
}

console.log(`🚀 Executing: ${command}`);

try {
  // Execute the command using the command executor
  const result = execSync(`node ${path.join(__dirname, 'specs/001-drive-narrator-voice-first/command-executor.js')} "${command}"`, {
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('✅ Command completed successfully');
} catch (error) {
  console.error('❌ Command failed:', error.message);
  process.exit(1);
}
