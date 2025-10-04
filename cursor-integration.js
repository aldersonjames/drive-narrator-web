#!/usr/bin/env node

/**
 * Cursor Integration Script
 * 
 * This script integrates the command system with Cursor's workflow.
 * It enforces mode-based restrictions and prevents unauthorized switching.
 */

const CursorCommandHandler = require('./cursor-command-handler');
const fs = require('fs');

class CursorIntegration {
  constructor() {
    this.handler = new CursorCommandHandler();
    this.state = this.handler.getCurrentState();
  }

  /**
   * Process a command from Cursor
   */
  processCommand(command) {
    // Check if it's a mode command
    if (command.startsWith('/')) {
      const result = this.handler.handleCommand(command);
      
      // Update state
      this.state = this.handler.getCurrentState();
      
      // Log the command
      this.logCommand(command, result);
      
      return result;
    }
    
    // Handle non-command input based on current mode
    return this.handleModeSpecificInput(command);
  }

  /**
   * Handle input that's not a command
   */
  handleModeSpecificInput(input) {
    const mode = this.state.mode;
    
    switch (mode) {
      case 'PLANNING':
        return this.handlePlanningInput(input);
      case 'ACTING':
        return this.handleActingInput(input);
      case 'STATUS':
        return this.handleStatusInput(input);
      case 'TESTING':
        return this.handleTestingInput(input);
      case 'DEPLOYMENT':
        return this.handleDeploymentInput(input);
      default:
        return this.handleNeutralInput(input);
    }
  }

  handlePlanningInput(input) {
    return {
      success: true,
      mode: 'PLANNING',
      response: `📋 **PLANNING MODE**

I can help you plan and analyze, but I cannot execute code or modify files.

What would you like me to plan or analyze?

Available actions:
- Analyze code structure
- Generate task breakdowns
- Create implementation plans
- Review requirements
- Generate documentation

Use \`/act\` to switch to acting mode when ready to implement.`
    };
  }

  handleActingInput(input) {
    return {
      success: true,
      mode: 'ACTING',
      response: `⚡ **ACTING MODE**

I can execute code changes and run commands, but I need explicit permission for each action.

What would you like me to implement or modify?

Available actions:
- Execute code changes
- Modify files
- Run terminal commands
- Deploy and release
- All development activities

Use \`/plan\` to switch to planning mode.
Use \`/exit\` to return to neutral mode.`
    };
  }

  handleStatusInput(input) {
    return {
      success: true,
      mode: 'STATUS',
      response: `📊 **STATUS MODE**

I can only read and report information. I cannot modify files or execute code.

What would you like me to check or report on?

Available actions:
- Check system status
- Analyze code structure
- Generate reports
- Review current state

Use \`/act\` to switch to acting mode.
Use \`/exit\` to return to neutral mode.`
    };
  }

  handleTestingInput(input) {
    return {
      success: true,
      mode: 'TESTING',
      response: `🧪 **TESTING MODE**

I can run tests and analyze results, but I cannot modify code or files.

What would you like me to test?

Available actions:
- Run unit tests
- Run integration tests
- Analyze test results
- Generate test reports

Use \`/act\` to switch to acting mode.
Use \`/exit\` to return to neutral mode.`
    };
  }

  handleDeploymentInput(input) {
    return {
      success: true,
      mode: 'DEPLOYMENT',
      response: `🚀 **DEPLOYMENT MODE**

I can deploy and release, but I cannot modify code or files.

What would you like me to deploy?

Available actions:
- Deploy to development
- Deploy to staging
- Deploy to production
- Monitor deployments

Use \`/act\` to switch to acting mode.
Use \`/exit\` to return to neutral mode.`
    };
  }

  handleNeutralInput(input) {
    return {
      success: true,
      mode: 'NEUTRAL',
      response: `🔄 **NEUTRAL MODE**

I am in neutral mode. Please use a command to enter a specific mode:

- \`/plan\` - Enter planning mode
- \`/act\` - Enter acting mode
- \`/status\` - Enter status mode
- \`/test\` - Enter testing mode
- \`/deploy\` - Enter deployment mode
- \`/help\` - Show help

What mode would you like to enter?`
    };
  }

  /**
   * Log commands for audit trail
   */
  logCommand(command, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      command: command,
      mode: result.mode,
      success: result.success,
      previousMode: result.previousMode
    };
    
    // Append to log file
    const logFile = 'cursor-command-log.json';
    let logs = [];
    
    try {
      const data = fs.readFileSync(logFile, 'utf8');
      logs = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start fresh
    }
    
    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return this.state;
  }

  /**
   * Check if action is allowed in current mode
   */
  isActionAllowed(action) {
    const mode = this.state.mode;
    const restrictions = this.handler.state.restrictions[mode.toLowerCase() + 'Mode'];
    
    if (!restrictions) return false;
    
    return restrictions.allowed.includes(action);
  }

  /**
   * Get available actions for current mode
   */
  getAvailableActions() {
    const mode = this.state.mode;
    const restrictions = this.handler.state.restrictions[mode.toLowerCase() + 'Mode'];
    
    if (!restrictions) return [];
    
    return restrictions.allowed;
  }
}

// Export for use in other modules
module.exports = CursorIntegration;

// CLI usage
if (require.main === module) {
  const command = process.argv.slice(2).join(' ');
  const integration = new CursorIntegration();
  
  const result = integration.processCommand(command);
  console.log(result.response);
  
  if (!result.success) {
    process.exit(1);
  }
}
