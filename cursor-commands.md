# Cursor Command System

## Available Commands

### Mode Commands
- `/plan` - Switch to planning mode (no code execution)
- `/act` - Switch to acting mode (code execution allowed)
- `/status` - Switch to status mode (read-only information)
- `/test` - Switch to testing mode (run tests only)
- `/deploy` - Switch to deployment mode (deploy only)

### Action Commands (only available in specific modes)
- `/help` - Show available commands for current mode
- `/exit` - Exit current mode (return to neutral)
- `/clear` - Clear current context

## Current Mode: NEUTRAL

**Available Commands:**
- `/plan` - Enter planning mode
- `/act` - Enter acting mode  
- `/status` - Enter status mode
- `/test` - Enter testing mode
- `/deploy` - Enter deployment mode
- `/help` - Show this help

## Mode Descriptions

### Planning Mode (`/plan`)
- **Purpose**: Generate plans, analyze requirements, create task breakdowns
- **Restrictions**: NO code execution, NO file modifications, NO terminal commands
- **Allowed**: Reading files, analyzing code, creating documentation, generating plans
- **Exit**: Use `/exit` or `/act` to switch modes

### Acting Mode (`/act`)
- **Purpose**: Execute code changes, run commands, implement features
- **Restrictions**: Must have explicit permission for each action
- **Allowed**: All coding activities, terminal commands, file modifications
- **Exit**: Use `/exit` or `/plan` to switch modes

### Status Mode (`/status`)
- **Purpose**: Read-only information gathering and reporting
- **Restrictions**: NO modifications, NO code execution
- **Allowed**: Reading files, checking status, generating reports
- **Exit**: Use `/exit` or other mode commands

### Testing Mode (`/test`)
- **Purpose**: Run tests and validate functionality
- **Restrictions**: Only test execution, no code changes
- **Allowed**: Running tests, analyzing test results, generating test reports
- **Exit**: Use `/exit` or other mode commands

### Deployment Mode (`/deploy`)
- **Purpose**: Deploy and release functionality
- **Restrictions**: Only deployment activities
- **Allowed**: Building, deploying, releasing, monitoring deployments
- **Exit**: Use `/exit` or other mode commands

## Usage Examples

```
/plan
> Now in PLANNING mode. I can analyze and plan but not execute code.

/act
> Now in ACTING mode. I can execute code changes and run commands.

/status
> Now in STATUS mode. I can only read and report information.

/exit
> Returning to NEUTRAL mode.
```

## Enforcement Rules

1. **Mode Switching**: Only allowed via explicit commands
2. **Action Restrictions**: Each mode has specific allowed/restricted actions
3. **Permission Required**: Acting mode requires explicit permission for each action
4. **State Persistence**: Mode persists until explicitly changed
5. **Clear Boundaries**: No mixing of modes without explicit command

## Current Status
- **Mode**: NEUTRAL
- **Last Command**: None
- **Available Actions**: Mode selection only
