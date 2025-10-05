# `/act` - Acting Mode

## Purpose

Switches Cursor AI into **ACTING MODE** where code execution, file modifications, and terminal commands are allowed.

## Overview

Acting mode enables the AI to make real changes to the codebase, run commands, and execute builds/tests. This mode requires explicit permission for each action and maintains an audit trail of all operations.

---

## Command Usage

```bash
# Enter acting mode
/act

# The AI will respond:
# "Now in ACTING mode. I can execute code changes and run commands."

# Work on implementation tasks
Implement feature X
Fix bug Y
Run tests and deploy

# Exit when done
/exit
```

---

## What Acting Mode Allows

### ✅ Code Execution

- Modify existing files
- Create new files
- Delete files
- Refactor code
- Fix bugs and errors

### ✅ Terminal Commands

- Run npm/yarn commands
- Execute build scripts
- Run tests
- Install dependencies
- Git operations (commit, push, etc.)
- Start/stop servers

### ✅ System Operations

- File system operations
- Environment configuration
- Database migrations
- Deployment tasks

---

## What Acting Mode Requires

### 🔒 Explicit Permission

- AI must **propose** each action before executing
- User approves or modifies proposed actions
- No silent/automatic changes without consent

### 📝 Clear Justification

- **Why**: Explain the reason for each change
- **What**: Specify exactly what will be modified
- **Impact**: Describe potential side effects
- **Reversibility**: Note if the change can be undone

### 🎯 Specific Targets

- List exact file paths that will be modified
- Specify commands that will be executed
- Identify dependencies that will be affected

---

## Acting Mode Workflow

### 1. Enter Acting Mode

```
/act
```

### 2. Propose Actions

AI will present planned actions:

```
I will:
1. Modify backend/src/api/routes/voiceController.ts (lines 45-67)
   - Add error handling for WebSocket failures
   - Reason: Prevent crashes on connection loss

2. Run terminal command: npm test
   - Verify the fix doesn't break existing tests

Proceed? (yes/no/modify)
```

### 3. Execute with Permission

- User approves: AI executes the actions
- User modifies: AI adjusts the plan
- User rejects: AI stops and asks for clarification

### 4. Report Results

AI provides feedback:

```
✅ Modified voiceController.ts
✅ Tests passed (24/24)
📝 Changes committed

Summary: WebSocket error handling implemented successfully.
```

### 5. Exit When Complete

```
/exit
```

---

## Comparison with Other Modes

| Mode           | Read Files | Analyze Code | Modify Files | Run Commands     | Deploy |
| -------------- | ---------- | ------------ | ------------ | ---------------- | ------ |
| **Acting**     | ✅         | ✅           | ✅           | ✅               | ✅     |
| **Planning**   | ✅         | ✅           | ❌           | ❌               | ❌     |
| **Status**     | ✅         | ✅           | ❌           | ❌               | ❌     |
| **Testing**    | ✅         | ✅           | ❌           | ✅ (tests only)  | ❌     |
| **Deployment** | ✅         | ✅           | ❌           | ✅ (deploy only) | ✅     |

---

## Best Practices

### ✅ Do

- Use acting mode for implementation sprints
- Verify changes with tests before committing
- Keep changes focused and incremental
- Document complex changes
- Exit acting mode when planning next steps

### ❌ Don't

- Make large, sweeping changes without discussion
- Skip testing after modifications
- Ignore linter errors or warnings
- Commit broken code
- Stay in acting mode during planning discussions

---

## Safety Features

### Audit Trail

All actions are logged in `cursor-command-log.json`:

```json
{
  "timestamp": "2025-10-05T03:00:00Z",
  "mode": "acting",
  "action": "modify_file",
  "target": "backend/src/api/routes/voiceController.ts",
  "approved": true,
  "result": "success"
}
```

### Reversibility

- Git integration allows easy rollback
- Changes are incremental and trackable
- Each action is a separate commit (when appropriate)

### Permission Gates

- High-risk operations require explicit confirmation
- Destructive commands (rm -rf, DROP TABLE, etc.) trigger warnings
- Force operations (git push --force) need double confirmation

---

## Common Acting Mode Tasks

### Feature Implementation

```
/act
Implement the POI alert scheduling system
```

### Bug Fixes

```
/act
Fix the WebSocket connection timeout issue in realtimeVoiceService.ts
```

### Refactoring

```
/act
Refactor the voice preview logic to use the centralized voice service
```

### Testing

```
/act
Run all tests and fix any failures
```

### Deployment

```
/act
Build the production bundle and deploy to staging
```

---

## Troubleshooting

### "Permission Denied" Errors

- Ensure you're in acting mode (`/act`)
- Check that the file/command is allowed
- Verify file permissions on the system

### "Mode Conflict" Errors

- Exit current mode first (`/exit`)
- Then enter acting mode (`/act`)

### Unexpected Behavior

- Check current mode: `/status`
- Review command history: `cat cursor-command-log.json`
- Reset if needed: `/exit` then `/act`

---

## Examples

### Example 1: Implementing a New Feature

```
User: /act
AI: Now in ACTING mode. I can execute code changes and run commands.

User: Implement text input fallback for voice failures

AI: I will implement the text input fallback feature:

1. Modify frontend/src/components/voice/RealtimeVoiceInterface.tsx
   - Add showFallbackInput state
   - Add error counter to track voice failures
   - Show text input after 2+ failures

2. Modify frontend/src/components/voice/VoiceConversationInterface.tsx
   - Apply same fallback logic
   - Add "Switch to Voice" button

3. Run linter to ensure code quality

Proceed?

User: yes

AI: ✅ Modified RealtimeVoiceInterface.tsx
    ✅ Modified VoiceConversationInterface.tsx
    ✅ Linter passed with no errors

Feature implemented successfully!
```

### Example 2: Fixing a Critical Bug

```
User: /act
AI: Now in ACTING mode.

User: Fix the async state bug in useConversationalAI

AI: I found the issue - the newest conversation turn isn't included
in the API payload due to async state updates.

Fix:
1. Modify frontend/src/hooks/useConversationalAI.ts (lines 74-104)
   - Include userTurn explicitly in history slice
   - Pass updated history to API call

This ensures the backend receives the complete conversation.

Proceed?

User: yes

AI: ✅ Fixed async state bug
    ✅ Tests pass
    📝 Committed changes
```

---

## Exit Acting Mode

```bash
# Return to neutral mode
/exit

# Or switch directly to another mode
/plan    # Switch to planning mode
/status  # Switch to status mode
```

---

## Related Commands

- `/plan` - Enter planning mode (analysis only)
- `/status` - Check current mode and permissions
- `/test` - Run tests without code changes
- `/deploy` - Deploy without modifying code
- `/help` - Show all available commands

---

## State Persistence

Acting mode persists across sessions until explicitly changed. Current state is stored in `cursor-state.json`.

Check current mode:

```bash
cat cursor-state.json
```

---

## Notes

- Acting mode is designed for focused implementation work
- Always test changes before committing
- Use `/plan` mode for design discussions
- Exit acting mode when done to prevent accidental changes
