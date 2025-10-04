# AI Commands: Drive Narrator Voice-First Companion

**Branch**: `001-drive-narrator-voice-first` | **Date**: 2025-10-04

## Overview

This document defines the AI commands that can be executed directly from the spec kit. These commands allow the AI to plan, act, and execute tasks based on the specification.

## Command Structure

All commands follow the format: `@command_name [parameters]`

## Core Commands

### @plan
**Purpose**: Create a detailed implementation plan for a specific feature or task
**Usage**: `@plan [feature_name] [priority] [timeline]`
**Parameters**:
- `feature_name`: Name of the feature to plan (e.g., "voice-conversation", "poi-alerts")
- `priority`: high, medium, low
- `timeline`: specific timeframe (e.g., "this-week", "next-month")

**Example**: `@plan voice-conversation high this-week`

**Output**: Detailed task breakdown with:
- Specific implementation steps
- File changes required
- Dependencies and prerequisites
- Testing requirements
- Success criteria

### @act
**Purpose**: Execute a specific task or implementation step
**Usage**: `@act [task_id] [action] [parameters]`
**Parameters**:
- `task_id`: Specific task identifier from the task list
- `action`: create, update, delete, test, deploy
- `parameters`: Additional parameters for the action

**Example**: `@act VR-001 create voice-recognition-component`

**Output**: 
- Task execution status
- Files created/modified
- Code changes made
- Testing results
- Next steps

### @status
**Purpose**: Get current project status and progress
**Usage**: `@status [scope]`
**Parameters**:
- `scope`: all, current-phase, specific-feature, tasks

**Example**: `@status current-phase`

**Output**:
- Current phase progress
- Completed tasks
- In-progress tasks
- Blocked tasks
- Next priorities

### @test
**Purpose**: Run tests for a specific feature or component
**Usage**: `@test [component] [test_type]`
**Parameters**:
- `component`: voice, location, poi, conversation, drive
- `test_type`: unit, integration, e2e, performance

**Example**: `@test voice unit`

**Output**:
- Test execution results
- Pass/fail status
- Performance metrics
- Coverage reports
- Recommendations

### @deploy
**Purpose**: Deploy changes to a specific environment
**Usage**: `@deploy [environment] [scope]`
**Parameters**:
- `environment`: dev, staging, production
- `scope`: all, frontend, backend, database

**Example**: `@deploy dev frontend`

**Output**:
- Deployment status
- Build results
- Environment updates
- Health checks
- Rollback procedures

## Feature-Specific Commands

### Voice System Commands

#### @voice-test
**Purpose**: Test voice functionality
**Usage**: `@voice-test [voice_id] [persona_id] [accent_id]`
**Example**: `@voice-test alloy adventure-seeker american`

#### @voice-preview
**Purpose**: Generate voice preview
**Usage**: `@voice-preview [text] [voice_settings]`
**Example**: `@voice-preview "Hello, welcome to Drive Narrator" {"voiceId":"alloy","persona":"local-expert"}`

#### @voice-analyze
**Purpose**: Analyze voice performance and quality
**Usage**: `@voice-analyze [session_id] [metrics]`
**Example**: `@voice-analyze session-123 response-time,accuracy,quality`

### Location System Commands

#### @location-track
**Purpose**: Start/stop location tracking
**Usage**: `@location-track [action] [settings]`
**Example**: `@location-track start {"accuracy":"high","interval":2000}`

#### @poi-detect
**Purpose**: Detect POIs near location
**Usage**: `@poi-detect [latitude] [longitude] [radius] [interests]`
**Example**: `@poi-detect 33.7490 -84.3880 5.0 ["restaurants","museums"]`

#### @poi-alert
**Purpose**: Trigger POI alert
**Usage**: `@poi-alert [poi_id] [drive_id] [alert_minutes]`
**Example**: `@poi-alert poi-123 drive-456 5`

### Conversation Commands

#### @conversation-start
**Purpose**: Start conversation session
**Usage**: `@conversation-start [profile_id] [drive_id] [context]`
**Example**: `@conversation-start user-123 drive-456 {"location":"atlanta","interests":["history"]}`

#### @conversation-process
**Purpose**: Process voice input
**Usage**: `@conversation-process [session_id] [input_text] [context]`
**Example**: `@conversation-process session-789 "Tell me about that building" {"poi_id":"poi-123"}`

#### @conversation-analyze
**Purpose**: Analyze conversation quality
**Usage**: `@conversation-analyze [session_id] [metrics]`
**Example**: `@conversation-analyze session-789 engagement,clarity,relevance`

### Drive Management Commands

#### @drive-start
**Purpose**: Start new drive session
**Usage**: `@drive-start [profile_id] [settings]`
**Example**: `@drive-start user-123 {"alert_minutes":5,"interests":["restaurants"]}`

#### @drive-update
**Purpose**: Update drive session
**Usage**: `@drive-update [drive_id] [updates]`
**Example**: `@drive-update drive-456 {"status":"paused","location":{"lat":33.7490,"lng":-84.3880}}`

#### @drive-end
**Purpose**: End drive session
**Usage**: `@drive-end [drive_id] [summary]`
**Example**: `@drive-end drive-456 {"total_distance":25.5,"poi_alerts":8,"duration":45}`

## Development Commands

### @code-generate
**Purpose**: Generate code for specific component
**Usage**: `@code-generate [component_type] [specifications]`
**Example**: `@code-generate react-component {"name":"VoiceCarousel","props":["voices","onSelect"]}`

### @code-review
**Purpose**: Review code changes
**Usage**: `@code-review [file_path] [focus_areas]`
**Example**: `@code-review src/components/voice/VoiceCarousel.tsx performance,accessibility`

### @refactor
**Purpose**: Refactor existing code
**Usage**: `@refactor [file_path] [refactor_type] [goals]`
**Example**: `@refactor src/hooks/useVoiceConversation.ts performance "reduce re-renders"`

### @optimize
**Purpose**: Optimize code or system
**Usage**: `@optimize [target] [optimization_type] [metrics]`
**Example**: `@optimize voice-response performance "reduce latency to <2s"`

## Testing Commands

### @test-unit
**Purpose**: Run unit tests
**Usage**: `@test-unit [component] [options]`
**Example**: `@test-unit VoiceCarousel --coverage --watch`

### @test-integration
**Purpose**: Run integration tests
**Usage**: `@test-integration [feature] [environment]`
**Example**: `@test-integration voice-conversation dev`

### @test-e2e
**Purpose**: Run end-to-end tests
**Usage**: `@test-e2e [scenario] [browser]`
**Example**: `@test-e2e complete-drive-flow chrome`

### @test-performance
**Purpose**: Run performance tests
**Usage**: `@test-performance [component] [metrics]`
**Example**: `@test-performance voice-response "response-time,memory-usage"`

## Database Commands

### @db-migrate
**Purpose**: Run database migrations
**Usage**: `@db-migrate [environment] [migration_name]`
**Example**: `@db-migrate dev add-conversation-turns`

### @db-seed
**Purpose**: Seed database with test data
**Usage**: `@db-seed [environment] [data_type]`
**Example**: `@db-seed dev voice-presets`

### @db-backup
**Purpose**: Create database backup
**Usage**: `@db-backup [environment] [backup_type]`
**Example**: `@db-backup production full`

## Monitoring Commands

### @monitor-status
**Purpose**: Check system status
**Usage**: `@monitor-status [component] [metrics]`
**Example**: `@monitor-status all "cpu,memory,response-time"`

### @monitor-logs
**Purpose**: View system logs
**Usage**: `@monitor-logs [component] [level] [timeframe]`
**Example**: `@monitor-logs voice error "last-hour"`

### @monitor-alerts
**Purpose**: Check system alerts
**Usage**: `@monitor-alerts [severity] [component]`
**Example**: `@monitor-alerts high voice`

## Command Execution Flow

### 1. Planning Phase
```
@plan voice-conversation high this-week
→ Generate detailed implementation plan
→ Identify required tasks and dependencies
→ Set success criteria and timeline
```

### 2. Execution Phase
```
@act VR-001 create voice-recognition-component
→ Create the component files
→ Implement required functionality
→ Add tests and documentation
→ Update task status
```

### 3. Testing Phase
```
@test voice unit
→ Run unit tests for voice components
→ Generate test reports
→ Identify issues and recommendations
```

### 4. Deployment Phase
```
@deploy dev frontend
→ Build and deploy frontend changes
→ Run health checks
→ Verify functionality
```

## Command Examples

### Complete Feature Implementation
```bash
# Plan the feature
@plan poi-alerts high this-week

# Execute tasks
@act PA-001 create poi-detection-service
@act PA-002 create alert-trigger-system
@act PA-003 create story-generation-service

# Test the implementation
@test poi unit
@test poi integration

# Deploy to development
@deploy dev all
```

### Voice System Testing
```bash
# Test voice preview
@voice-preview "Welcome to Drive Narrator" {"voiceId":"alloy","persona":"local-expert"}

# Test voice conversation
@conversation-start user-123 drive-456 {"location":"atlanta"}
@conversation-process session-789 "Tell me about restaurants nearby"

# Analyze voice performance
@voice-analyze session-789 response-time,accuracy,quality
```

### Drive Session Management
```bash
# Start a drive
@drive-start user-123 {"alert_minutes":5,"interests":["restaurants","museums"]}

# Update drive with location
@drive-update drive-456 {"location":{"lat":33.7490,"lng":-84.3880}}

# End drive with summary
@drive-end drive-456 {"total_distance":25.5,"poi_alerts":8,"duration":45}
```

## Error Handling

### Command Validation
- All commands are validated before execution
- Invalid parameters return helpful error messages
- Missing dependencies are identified and reported

### Execution Errors
- Failed commands provide detailed error information
- Rollback procedures are available for critical operations
- Error logs are automatically generated and stored

### Recovery Procedures
- Automatic retry for transient failures
- Manual intervention for critical errors
- System state restoration capabilities

## Command History

### Tracking
- All commands are logged with timestamps
- Execution results are stored for analysis
- Performance metrics are collected

### Audit Trail
- Command execution history
- User actions and changes
- System modifications and deployments

### Reporting
- Command usage statistics
- Performance analysis
- Error rate monitoring

## Best Practices

### Command Usage
1. **Always plan before acting** - Use `@plan` before `@act`
2. **Test frequently** - Use `@test` commands regularly
3. **Monitor results** - Use `@monitor` commands to track progress
4. **Document changes** - Commands automatically update documentation

### Error Prevention
1. **Validate parameters** - Check command parameters before execution
2. **Check dependencies** - Ensure prerequisites are met
3. **Backup before changes** - Use `@db-backup` before major changes
4. **Test in dev first** - Always test in development before production

### Performance Optimization
1. **Use specific commands** - Target specific components when possible
2. **Batch operations** - Combine related commands when appropriate
3. **Monitor resources** - Use `@monitor-status` to track system health
4. **Optimize regularly** - Use `@optimize` commands to improve performance
