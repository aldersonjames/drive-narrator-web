#!/usr/bin/env node

/**
 * Cursor Command Handler
 * 
 * Enforces mode-based command system to prevent unauthorized switching
 * between planning and acting modes.
 */

const fs = require('fs');
const path = require('path');

class CursorCommandHandler {
  constructor() {
    this.stateFile = path.join(__dirname, 'cursor-state.json');
    this.commandsFile = path.join(__dirname, 'cursor-commands.md');
    this.state = this.loadState();
  }

  loadState() {
    try {
      const data = fs.readFileSync(this.stateFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {
        currentMode: "NEUTRAL",
        modeHistory: [],
        lastCommand: null,
        permissions: {
          canExecuteCode: false,
          canModifyFiles: false,
          canRunTerminal: false,
          canReadFiles: true,
          canAnalyze: true,
          canPlan: true
        }
      };
    }
  }

  saveState() {
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  handleCommand(command) {
    const [cmd, ...args] = command.trim().split(' ');
    
    switch (cmd) {
      case '/plan':
        return this.switchToMode('PLANNING', args);
      case '/act':
        return this.switchToMode('ACTING', args);
      case '/status':
        return this.switchToMode('STATUS', args);
      case '/test':
        return this.switchToMode('TESTING', args);
      case '/deploy':
        return this.switchToMode('DEPLOYMENT', args);
      case '/exit':
        return this.exitMode();
      case '/help':
        return this.showHelp();
      case '/clear':
        return this.clearContext();
      default:
        return this.handleModeSpecificCommand(cmd, args);
    }
  }

  switchToMode(mode, args = []) {
    const previousMode = this.state.currentMode;
    
    // Update state
    this.state.currentMode = mode;
    this.state.modeHistory.push({
      mode: mode,
      timestamp: new Date().toISOString(),
      previousMode: previousMode
    });
    this.state.lastCommand = `/plan`;
    this.state.session.commandCount++;
    
    // Update permissions based on mode
    this.updatePermissions(mode);
    
    // Save state
    this.saveState();
    
    // Generate response
    const response = this.generateModeResponse(mode, args);
    
    return {
      success: true,
      mode: mode,
      previousMode: previousMode,
      response: response,
      permissions: this.state.permissions
    };
  }

  updatePermissions(mode) {
    const restrictions = this.state.restrictions[mode.toLowerCase() + 'Mode'];
    
    if (restrictions) {
      this.state.permissions = {
        canExecuteCode: restrictions.allowed.includes('execute'),
        canModifyFiles: restrictions.allowed.includes('modify'),
        canRunTerminal: restrictions.allowed.includes('terminal'),
        canReadFiles: restrictions.allowed.includes('read'),
        canAnalyze: restrictions.allowed.includes('analyze'),
        canPlan: restrictions.allowed.includes('plan'),
        canTest: restrictions.allowed.includes('test'),
        canDeploy: restrictions.allowed.includes('deploy')
      };
    }
  }

  generateModeResponse(mode, args) {
    const responses = {
      'PLANNING': `🎯 **PLANNING MODE ACTIVATED**

I am now in planning mode. I can:
- ✅ Read and analyze code
- ✅ Generate plans and task breakdowns
- ✅ Create documentation
- ✅ Analyze requirements
- ❌ Execute code or modify files
- ❌ Run terminal commands

Use \`/act\` to switch to acting mode when ready to implement.
Use \`/exit\` to return to neutral mode.`,

      'ACTING': `⚡ **ACTING MODE ACTIVATED**

I am now in acting mode. I can:
- ✅ Execute code changes
- ✅ Modify files
- ✅ Run terminal commands
- ✅ Deploy and release
- ✅ All development activities

**Note**: Each action requires explicit permission.
Use \`/plan\` to switch to planning mode.
Use \`/exit\` to return to neutral mode.`,

      'STATUS': `📊 **STATUS MODE ACTIVATED**

I am now in status mode. I can:
- ✅ Read files and analyze code
- ✅ Generate reports and status updates
- ✅ Check system status
- ❌ Execute code or modify files
- ❌ Run terminal commands

Use \`/act\` to switch to acting mode.
Use \`/exit\` to return to neutral mode.`,

      'TESTING': `🧪 **TESTING MODE ACTIVATED**

I am now in testing mode. I can:
- ✅ Run tests
- ✅ Analyze test results
- ✅ Generate test reports
- ❌ Modify code or files
- ❌ Deploy or release

Use \`/act\` to switch to acting mode.
Use \`/exit\` to return to neutral mode.`,

      'DEPLOYMENT': `🚀 **DEPLOYMENT MODE ACTIVATED**

I am now in deployment mode. I can:
- ✅ Deploy and release
- ✅ Monitor deployments
- ✅ Build and package
- ❌ Modify code or files
- ❌ Run tests

Use \`/act\` to switch to acting mode.
Use \`/exit\` to return to neutral mode.`
    };

    return responses[mode] || 'Unknown mode activated.';
  }

  exitMode() {
    const previousMode = this.state.currentMode;
    this.state.currentMode = 'NEUTRAL';
    this.state.lastCommand = '/exit';
    this.state.session.commandCount++;
    
    // Reset to neutral permissions
    this.state.permissions = {
      canExecuteCode: false,
      canModifyFiles: false,
      canRunTerminal: false,
      canReadFiles: true,
      canAnalyze: true,
      canPlan: true
    };
    
    this.saveState();
    
    return {
      success: true,
      mode: 'NEUTRAL',
      previousMode: previousMode,
      response: `🔄 **RETURNED TO NEUTRAL MODE**

I am now in neutral mode. Available commands:
- \`/plan\` - Enter planning mode
- \`/act\` - Enter acting mode
- \`/status\` - Enter status mode
- \`/test\` - Enter testing mode
- \`/deploy\` - Enter deployment mode
- \`/help\` - Show help
- \`/exit\` - Exit current mode`
    };
  }

  showHelp() {
    const helpText = fs.readFileSync(this.commandsFile, 'utf8');
    return {
      success: true,
      response: helpText
    };
  }

  clearContext() {
    this.state.session = {
      startTime: new Date().toISOString(),
      commandCount: 0,
      lastAction: null
    };
    this.saveState();
    
    return {
      success: true,
      response: '🧹 **CONTEXT CLEARED**\n\nSession context has been cleared. Ready for new commands.'
    };
  }

  handleModeSpecificCommand(cmd, args) {
    // Handle commands specific to current mode
    const mode = this.state.currentMode;
    
    if (mode === 'NEUTRAL') {
      return {
        success: false,
        response: `❌ **INVALID COMMAND IN NEUTRAL MODE**

Command \`${cmd}\` is not available in neutral mode.
Use \`/plan\`, \`/act\`, \`/status\`, \`/test\`, or \`/deploy\` to enter a specific mode.
Use \`/help\` to see available commands.`
      };
    }
    
    // Mode-specific command handling would go here
    return {
      success: false,
      response: `❌ **UNKNOWN COMMAND**

Command \`${cmd}\` is not recognized in ${mode} mode.
Use \`/help\` to see available commands for current mode.`
    };
  }

  getCurrentState() {
    return {
      mode: this.state.currentMode,
      permissions: this.state.permissions,
      lastCommand: this.state.lastCommand,
      commandCount: this.state.session.commandCount
    };
  }
}

// Export for use in other modules
module.exports = CursorCommandHandler;

// CLI usage
if (require.main === module) {
  const command = process.argv.slice(2).join(' ');
  const handler = new CursorCommandHandler();
  
  const result = handler.handleCommand(command);
  console.log(result.response);
  
  if (!result.success) {
    process.exit(1);
  }
}
