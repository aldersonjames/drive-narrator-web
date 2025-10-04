# Cursor Command System

## Overview

This system enforces mode-based restrictions in Cursor to prevent unauthorized switching between planning and acting modes. You can only be in one mode at a time, and switching requires explicit commands.

## Quick Start

### 1. Initialize the System
```bash
node cursor-integration.js
```

### 2. Use Commands
- `/plan` - Enter planning mode (no code execution)
- `/act` - Enter acting mode (code execution allowed)
- `/status` - Enter status mode (read-only)
- `/test` - Enter testing mode (run tests only)
- `/deploy` - Enter deployment mode (deploy only)
- `/exit` - Return to neutral mode
- `/help` - Show help

## How It Works

### Mode Enforcement
- **Planning Mode**: Can read, analyze, plan, document - NO code execution
- **Acting Mode**: Can execute code, modify files, run commands - requires permission
- **Status Mode**: Can only read and report - NO modifications
- **Testing Mode**: Can run tests and analyze results - NO code changes
- **Deployment Mode**: Can deploy and release - NO code changes

### State Persistence
- Mode persists until explicitly changed
- Command history is logged
- Permissions are enforced per mode

## Usage Examples

### Planning Session
```
/plan
> Now in PLANNING mode. I can analyze and plan but not execute code.

Analyze the voice integration code
> I can analyze the code structure and identify issues...

/act
> Now in ACTING mode. I can execute code changes and run commands.

Fix the voice integration
> I can fix the code, but I need explicit permission for each action.
```

### Acting Session
```
/act
> Now in ACTING mode. I can execute code changes and run commands.

Implement the voice fix
> I can implement the fix, but I need explicit permission for each action.

/plan
> Now in PLANNING mode. I can analyze and plan but not execute code.
```

## Files Created

- `cursor-commands.md` - Command documentation
- `cursor-state.json` - Current state and permissions
- `cursor-command-handler.js` - Core command handling
- `cursor-integration.js` - Cursor integration
- `cursor-command-log.json` - Command audit trail

## Integration with Cursor

### Option 1: Direct Integration
Add this to your Cursor workflow:
```javascript
const CursorIntegration = require('./cursor-integration');
const integration = new CursorIntegration();

// Process commands
const result = integration.processCommand('/plan');
console.log(result.response);
```

### Option 2: Command Line
```bash
# Enter planning mode
node cursor-integration.js /plan

# Enter acting mode  
node cursor-integration.js /act

# Exit to neutral
node cursor-integration.js /exit
```

### Option 3: Custom Cursor Extension
Create a Cursor extension that uses this system to enforce mode restrictions.

## Benefits

1. **Prevents Unauthorized Switching**: Can't jump from planning to acting without explicit command
2. **Clear Boundaries**: Each mode has specific allowed/forbidden actions
3. **Audit Trail**: All commands are logged for review
4. **State Persistence**: Mode persists across sessions
5. **Permission System**: Acting mode requires explicit permission for each action

## Troubleshooting

### Reset State
```bash
rm cursor-state.json
node cursor-integration.js /help
```

### View Command History
```bash
cat cursor-command-log.json
```

### Check Current State
```bash
node -e "const CursorIntegration = require('./cursor-integration'); const i = new CursorIntegration(); console.log(i.getCurrentState());"
```

## Customization

You can modify the restrictions in `cursor-command-handler.js` to add new modes or change permissions:

```javascript
restrictions: {
  planningMode: {
    allowed: ["read", "analyze", "plan", "document"],
    forbidden: ["execute", "modify", "terminal", "deploy"]
  },
  // Add new modes here
}
```

## Security Notes

- Commands are logged for audit purposes
- State is persisted in JSON files
- No sensitive data is stored in logs
- Mode switching requires explicit commands
- Acting mode requires permission for each action
