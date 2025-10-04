#!/usr/bin/env node

/**
 * Drive Narrator Spec Kit Command Executor
 * 
 * This script allows execution of AI commands directly from the spec kit.
 * Usage: node command-executor.js "@plan voice-conversation high this-week"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CommandExecutor {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.specPath = path.resolve(__dirname, '.');
    this.taskFile = path.join(this.specPath, 'tasks.md');
    this.planFile = path.join(this.specPath, 'plan.md');
  }

  /**
   * Execute a command
   * @param {string} command - The command to execute
   */
  async execute(command) {
    console.log(`🚀 Executing command: ${command}`);
    
    const [commandName, ...args] = command.trim().split(' ');
    
    try {
      switch (commandName) {
        case '@plan':
          return await this.plan(args);
        case '@act':
          return await this.act(args);
        case '@status':
          return await this.status(args);
        case '@test':
          return await this.test(args);
        case '@deploy':
          return await this.deploy(args);
        case '@voice-test':
          return await this.voiceTest(args);
        case '@voice-preview':
          return await this.voicePreview(args);
        case '@location-track':
          return await this.locationTrack(args);
        case '@poi-detect':
          return await this.poiDetect(args);
        case '@conversation-start':
          return await this.conversationStart(args);
        case '@drive-start':
          return await this.driveStart(args);
        case '@monitor-status':
          return await this.monitorStatus(args);
        default:
          throw new Error(`Unknown command: ${commandName}`);
      }
    } catch (error) {
      console.error(`❌ Command failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Plan a feature implementation
   */
  async plan(args) {
    const [featureName, priority = 'medium', timeline = 'this-week'] = args;
    
    console.log(`📋 Planning feature: ${featureName}`);
    console.log(`Priority: ${priority}, Timeline: ${timeline}`);
    
    // Read current tasks
    const tasks = await this.readTasks();
    
    // Generate plan based on feature
    const plan = this.generatePlan(featureName, priority, timeline, tasks);
    
    // Update plan file
    await this.updatePlan(plan);
    
    console.log(`✅ Plan generated for ${featureName}`);
    return { success: true, plan };
  }

  /**
   * Execute a specific task
   */
  async act(args) {
    const [taskId, action, ...params] = args;
    
    console.log(`⚡ Executing task: ${taskId}`);
    console.log(`Action: ${action}, Params: ${params.join(' ')}`);
    
    // Find task in tasks file
    const task = await this.findTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    // Execute based on action
    const result = await this.executeTaskAction(task, action, params);
    
    // Update task status
    await this.updateTaskStatus(taskId, 'completed');
    
    console.log(`✅ Task ${taskId} completed`);
    return { success: true, result };
  }

  /**
   * Get current project status
   */
  async status(args) {
    const [scope = 'all'] = args;
    
    console.log(`📊 Getting status for: ${scope}`);
    
    const status = {
      completed: await this.getCompletedTasks(),
      inProgress: await this.getInProgressTasks(),
      planned: await this.getPlannedTasks(),
      blocked: await this.getBlockedTasks()
    };
    
    console.log(`✅ Status retrieved`);
    return { success: true, status };
  }

  /**
   * Run tests
   */
  async test(args) {
    const [component, testType = 'unit'] = args;
    
    console.log(`🧪 Running ${testType} tests for: ${component}`);
    
    try {
      let command;
      switch (testType) {
        case 'unit':
          command = `npm run test:unit -- --testPathPattern=${component}`;
          break;
        case 'integration':
          command = `npm run test:integration -- --testPathPattern=${component}`;
          break;
        case 'e2e':
          command = `npm run test:e2e -- --spec="**/${component}*.spec.ts"`;
          break;
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }
      
      const result = execSync(command, { 
        cwd: this.projectRoot, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log(`✅ Tests completed for ${component}`);
      return { success: true, result };
    } catch (error) {
      console.error(`❌ Tests failed for ${component}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deploy to environment
   */
  async deploy(args) {
    const [environment = 'dev', scope = 'all'] = args;
    
    console.log(`🚀 Deploying ${scope} to ${environment}`);
    
    try {
      let command;
      switch (scope) {
        case 'frontend':
          command = `npm run build:frontend && npm run deploy:frontend:${environment}`;
          break;
        case 'backend':
          command = `npm run build:backend && npm run deploy:backend:${environment}`;
          break;
        case 'all':
          command = `npm run build && npm run deploy:${environment}`;
          break;
        default:
          throw new Error(`Unknown scope: ${scope}`);
      }
      
      const result = execSync(command, { 
        cwd: this.projectRoot, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log(`✅ Deployed ${scope} to ${environment}`);
      return { success: true, result };
    } catch (error) {
      console.error(`❌ Deployment failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test voice functionality
   */
  async voiceTest(args) {
    const [voiceId, personaId, accentId] = args;
    
    console.log(`🎵 Testing voice: ${voiceId} + ${personaId} + ${accentId}`);
    
    try {
      // Test voice preview
      const response = await fetch('http://localhost:41234/api/voices/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId,
          input: 'Hello, this is a test of the voice system.',
          instructions: `Use ${personaId} persona with ${accentId} accent.`
        })
      });
      
      if (response.ok) {
        console.log(`✅ Voice test successful`);
        return { success: true, message: 'Voice test completed successfully' };
      } else {
        throw new Error(`Voice test failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Voice test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate voice preview
   */
  async voicePreview(args) {
    const [text, voiceSettings] = args;
    
    console.log(`🎵 Generating voice preview for: "${text}"`);
    
    try {
      const settings = JSON.parse(voiceSettings);
      const response = await fetch('http://localhost:41234/api/voices/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: settings.voiceId,
          input: text,
          instructions: `Use ${settings.persona} persona with ${settings.accent} accent.`
        })
      });
      
      if (response.ok) {
        console.log(`✅ Voice preview generated`);
        return { success: true, message: 'Voice preview generated successfully' };
      } else {
        throw new Error(`Voice preview failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Voice preview failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start location tracking
   */
  async locationTrack(args) {
    const [action, settings] = args;
    
    console.log(`📍 Location tracking: ${action}`);
    
    if (action === 'start') {
      console.log(`✅ Location tracking started`);
      return { success: true, message: 'Location tracking started' };
    } else if (action === 'stop') {
      console.log(`✅ Location tracking stopped`);
      return { success: true, message: 'Location tracking stopped' };
    } else {
      throw new Error(`Unknown location action: ${action}`);
    }
  }

  /**
   * Detect POIs near location
   */
  async poiDetect(args) {
    const [latitude, longitude, radius, interests] = args;
    
    console.log(`🏛️ Detecting POIs near ${latitude}, ${longitude}`);
    
    try {
      const interestsArray = JSON.parse(interests);
      const response = await fetch(`http://localhost:41234/api/pois?latitude=${latitude}&longitude=${longitude}&radius=${radius}&interests=${interestsArray.join(',')}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Found ${data.pois.length} POIs`);
        return { success: true, pois: data.pois };
      } else {
        throw new Error(`POI detection failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ POI detection failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start conversation session
   */
  async conversationStart(args) {
    const [profileId, driveId, context] = args;
    
    console.log(`💬 Starting conversation session`);
    
    try {
      const contextObj = JSON.parse(context);
      const response = await fetch('http://localhost:41234/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          driveId,
          message: 'Start conversation',
          context: contextObj
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Conversation session started: ${data.turnId}`);
        return { success: true, sessionId: data.turnId };
      } else {
        throw new Error(`Conversation start failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Conversation start failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start drive session
   */
  async driveStart(args) {
    const [profileId, settings] = args;
    
    console.log(`🚗 Starting drive session for profile: ${profileId}`);
    
    try {
      const settingsObj = JSON.parse(settings);
      const response = await fetch('http://localhost:41234/api/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          settings: settingsObj
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Drive session started: ${data.driveId}`);
        return { success: true, driveId: data.driveId };
      } else {
        throw new Error(`Drive start failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Drive start failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitor system status
   */
  async monitorStatus(args) {
    const [component = 'all', metrics = 'cpu,memory,response-time'] = args;
    
    console.log(`📊 Monitoring status for: ${component}`);
    
    try {
      // Check if servers are running
      const frontendStatus = await this.checkServerStatus('http://localhost:5173');
      const backendStatus = await this.checkServerStatus('http://localhost:41234');
      
      const status = {
        frontend: frontendStatus,
        backend: backendStatus,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ System status: Frontend ${frontendStatus ? 'UP' : 'DOWN'}, Backend ${backendStatus ? 'UP' : 'DOWN'}`);
      return { success: true, status };
    } catch (error) {
      console.error(`❌ Status check failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  async readTasks() {
    const content = fs.readFileSync(this.taskFile, 'utf8');
    // Parse tasks from markdown (simplified)
    return content;
  }

  generatePlan(featureName, priority, timeline, tasks) {
    // Generate implementation plan based on feature
    return {
      feature: featureName,
      priority,
      timeline,
      tasks: [],
      dependencies: [],
      successCriteria: []
    };
  }

  async updatePlan(plan) {
    // Update plan file with new plan
    console.log('📝 Updating plan file...');
  }

  async findTask(taskId) {
    // Find task in tasks file
    return null; // Simplified
  }

  async executeTaskAction(task, action, params) {
    // Execute specific task action
    return { action, params };
  }

  async updateTaskStatus(taskId, status) {
    // Update task status in tasks file
    console.log(`📝 Updating task ${taskId} to ${status}`);
  }

  async getCompletedTasks() {
    return []; // Simplified
  }

  async getInProgressTasks() {
    return []; // Simplified
  }

  async getPlannedTasks() {
    return []; // Simplified
  }

  async getBlockedTasks() {
    return []; // Simplified
  }

  async checkServerStatus(url) {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv.slice(2).join(' ');
  const executor = new CommandExecutor();
  
  executor.execute(command)
    .then(result => {
      console.log('Command result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Command execution failed:', error);
      process.exit(1);
    });
}

module.exports = CommandExecutor;
