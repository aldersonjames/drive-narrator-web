# Drive Narrator Spec Kit Commands - Demo

This document demonstrates how to use the AI commands in the Drive Narrator spec kit.

## Quick Start

### 1. Check System Status
```bash
# Check if servers are running
npm run cmd "@monitor-status all cpu,memory,response-time"

# Or use the shorthand
npm run status
```

### 2. Plan a Feature
```bash
# Plan voice conversation system
npm run cmd "@plan voice-conversation high this-week"

# Plan POI alert system
npm run cmd "@plan poi-alerts medium next-week"
```

### 3. Execute Tasks
```bash
# Create a voice recognition component
npm run cmd "@act VR-001 create voice-recognition-component"

# Test voice functionality
npm run cmd "@voice-test alloy adventure-seeker american"
```

### 4. Test Features
```bash
# Run unit tests for voice components
npm run cmd "@test voice unit"

# Run integration tests
npm run cmd "@test voice integration"
```

## Command Examples

### Voice System Commands

#### Test Voice Combinations
```bash
# Test different voice + persona + accent combinations
npm run cmd "@voice-test alloy local-expert american"
npm run cmd "@voice-test echo adventure-seeker british"
npm run cmd "@voice-test shimmer storyteller scottish"
```

#### Generate Voice Previews
```bash
# Generate preview with specific settings
npm run cmd "@voice-preview 'Welcome to Drive Narrator' '{\"voiceId\":\"alloy\",\"persona\":\"local-expert\",\"accent\":\"american\"}'"
```

### Location & POI Commands

#### Start Location Tracking
```bash
# Start location tracking with high accuracy
npm run cmd "@location-track start '{\"accuracy\":\"high\",\"interval\":2000}'"
```

#### Detect Nearby POIs
```bash
# Find restaurants and museums near Atlanta
npm run cmd "@poi-detect 33.7490 -84.3880 5.0 '[\"restaurants\",\"museums\"]'"
```

### Conversation Commands

#### Start Conversation Session
```bash
# Start conversation for a drive
npm run cmd "@conversation-start traveler-001 drive-456 '{\"location\":\"atlanta\",\"interests\":[\"history\",\"food\"]}'"
```

### Drive Management Commands

#### Start Drive Session
```bash
# Start a new drive with specific settings
npm run cmd "@drive-start traveler-001 '{\"alert_minutes\":5,\"interests\":[\"restaurants\",\"museums\"],\"detour_preference\":\"medium\"}'"
```

## Development Workflow

### 1. Plan Your Work
```bash
# Plan the next feature
npm run cmd "@plan voice-conversation high this-week"
```

### 2. Execute Tasks
```bash
# Work through the planned tasks
npm run cmd "@act VR-001 create voice-recognition-component"
npm run cmd "@act VR-002 add voice-command-parsing"
npm run cmd "@act VR-003 integrate-openai-gpt"
```

### 3. Test Your Work
```bash
# Test the implementation
npm run cmd "@test voice unit"
npm run cmd "@test voice integration"
```

### 4. Deploy Changes
```bash
# Deploy to development
npm run cmd "@deploy dev frontend"
npm run cmd "@deploy dev backend"
```

## Advanced Usage

### Batch Operations
```bash
# Run multiple commands in sequence
npm run cmd "@plan voice-conversation high this-week" && \
npm run cmd "@act VR-001 create voice-recognition-component" && \
npm run cmd "@test voice unit"
```

### Monitoring
```bash
# Monitor system health
npm run cmd "@monitor-status all cpu,memory,response-time,disk-usage"

# Check specific components
npm run cmd "@monitor-status voice response-time,accuracy,quality"
```

### Error Handling
```bash
# If a command fails, check the logs
npm run cmd "@monitor-logs voice error last-hour"

# Retry failed operations
npm run cmd "@act VR-001 create voice-recognition-component"
```

## Command Reference

### Core Commands
- `@plan [feature] [priority] [timeline]` - Plan feature implementation
- `@act [task_id] [action] [params]` - Execute specific task
- `@status [scope]` - Get project status
- `@test [component] [type]` - Run tests
- `@deploy [env] [scope]` - Deploy to environment

### Voice Commands
- `@voice-test [voice] [persona] [accent]` - Test voice combination
- `@voice-preview [text] [settings]` - Generate voice preview
- `@voice-analyze [session] [metrics]` - Analyze voice performance

### Location Commands
- `@location-track [action] [settings]` - Control location tracking
- `@poi-detect [lat] [lng] [radius] [interests]` - Detect nearby POIs
- `@poi-alert [poi_id] [drive_id] [minutes]` - Trigger POI alert

### Conversation Commands
- `@conversation-start [profile] [drive] [context]` - Start conversation
- `@conversation-process [session] [input] [context]` - Process voice input
- `@conversation-analyze [session] [metrics]` - Analyze conversation

### Drive Commands
- `@drive-start [profile] [settings]` - Start drive session
- `@drive-update [drive_id] [updates]` - Update drive session
- `@drive-end [drive_id] [summary]` - End drive session

### Monitoring Commands
- `@monitor-status [component] [metrics]` - Check system status
- `@monitor-logs [component] [level] [timeframe]` - View logs
- `@monitor-alerts [severity] [component]` - Check alerts

## Tips & Best Practices

### 1. Always Plan First
```bash
# Plan before acting
npm run cmd "@plan voice-conversation high this-week"
```

### 2. Test Frequently
```bash
# Test after each major change
npm run cmd "@test voice unit"
```

### 3. Monitor Performance
```bash
# Check system health regularly
npm run cmd "@monitor-status all"
```

### 4. Use Specific Commands
```bash
# Be specific about what you want to test
npm run cmd "@test voice unit"  # Not just @test
```

### 5. Check Status Before Acting
```bash
# Make sure servers are running
npm run cmd "@monitor-status all"  # Before running other commands
```

## Troubleshooting

### Command Not Found
```bash
# Make sure you're in the project root
pwd  # Should be /path/to/drive-narrator-web

# Check if command executor exists
ls -la specs/001-drive-narrator-voice-first/command-executor.js
```

### Server Not Running
```bash
# Start the development servers
npm run dev

# Check status
npm run cmd "@monitor-status all"
```

### Permission Denied
```bash
# Make scripts executable
chmod +x run-command.js
chmod +x specs/001-drive-narrator-voice-first/command-executor.js
```

### API Errors
```bash
# Check if backend is running
curl http://localhost:41234/api/voices

# Check logs
npm run cmd "@monitor-logs backend error last-hour"
```

## Next Steps

1. **Try the commands** - Start with `npm run status` to check system health
2. **Plan a feature** - Use `npm run cmd "@plan voice-conversation high this-week"`
3. **Execute tasks** - Work through the planned tasks with `@act` commands
4. **Test your work** - Use `@test` commands to verify functionality
5. **Monitor progress** - Use `@status` and `@monitor-status` to track progress

The spec kit commands make it easy to plan, execute, and monitor your Drive Narrator development work!
