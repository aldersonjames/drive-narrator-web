/**
 * Conversation Memory Service
 * Handles persistent storage, learning, and context adaptation for conversations
 */

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    intent?: string;
    topics?: string[];
    [key: string]: unknown;
  };
}

export interface ConversationSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  turns: ConversationTurn[];
  context?: {
    interests?: string[];
    location?: string;
    [key: string]: unknown;
  };
}

export interface UserPreferences {
  commonTopics: Map<string, number>; // topic -> frequency
  commonIntents: Map<string, number>; // intent -> frequency
  preferredResponseStyle?: 'brief' | 'detailed' | 'conversational';
  averageSessionDuration?: number;
  lastInteractionTime?: Date;
}

const STORAGE_KEYS = {
  SESSIONS: 'drive_narrator_conversation_sessions',
  CURRENT_SESSION: 'drive_narrator_current_session',
  USER_PREFERENCES: 'drive_narrator_user_preferences',
  LEARNING_DATA: 'drive_narrator_learning_data',
};

const MAX_STORED_SESSIONS = 10; // Keep last 10 sessions
const MAX_TURNS_PER_SESSION = 100; // Limit turns per session

class ConversationMemoryService {
  private currentSession: ConversationSession | null = null;

  /**
   * Start a new conversation session
   */
  startSession(context?: ConversationSession['context']): ConversationSession {
    const session: ConversationSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      startTime: new Date(),
      turns: [],
      context,
    };

    this.currentSession = session;
    this.saveToStorage(STORAGE_KEYS.CURRENT_SESSION, session);
    return session;
  }

  /**
   * End the current conversation session
   */
  endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date();

    // Save to sessions history
    const sessions = this.getSessions();
    sessions.unshift(this.currentSession);

    // Keep only MAX_STORED_SESSIONS
    if (sessions.length > MAX_STORED_SESSIONS) {
      sessions.splice(MAX_STORED_SESSIONS);
    }

    this.saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
    this.updateLearningData(this.currentSession);

    // Clear current session
    this.currentSession = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }

  /**
   * Add a turn to the current session
   */
  addTurn(turn: Omit<ConversationTurn, 'id' | 'timestamp'>): ConversationTurn {
    if (!this.currentSession) {
      this.startSession();
    }

    const fullTurn: ConversationTurn = {
      ...turn,
      id: `turn-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
    };

    this.currentSession!.turns.push(fullTurn);

    // Trim if exceeds max turns
    if (this.currentSession!.turns.length > MAX_TURNS_PER_SESSION) {
      this.currentSession!.turns.shift();
    }

    this.saveToStorage(STORAGE_KEYS.CURRENT_SESSION, this.currentSession);
    return fullTurn;
  }

  /**
   * Get current conversation session
   */
  getCurrentSession(): ConversationSession | null {
    if (!this.currentSession) {
      const stored = this.getFromStorage<ConversationSession>(STORAGE_KEYS.CURRENT_SESSION);
      if (stored) {
        // Restore dates
        stored.startTime = new Date(stored.startTime);
        if (stored.endTime) stored.endTime = new Date(stored.endTime);
        stored.turns = stored.turns.map((turn) => ({
          ...turn,
          timestamp: new Date(turn.timestamp),
        }));
        this.currentSession = stored;
      }
    }
    return this.currentSession;
  }

  /**
   * Get recent conversation turns (for context)
   */
  getRecentTurns(limit: number = 10): ConversationTurn[] {
    const session = this.getCurrentSession();
    if (!session) return [];

    return session.turns.slice(-limit);
  }

  /**
   * Get all stored sessions
   */
  getSessions(): ConversationSession[] {
    return this.getFromStorage<ConversationSession[]>(STORAGE_KEYS.SESSIONS) || [];
  }

  /**
   * Search conversation history by content
   */
  searchHistory(query: string): ConversationTurn[] {
    const sessions = this.getSessions();
    const results: ConversationTurn[] = [];
    const queryLower = query.toLowerCase();

    for (const session of sessions) {
      for (const turn of session.turns) {
        if (turn.content.toLowerCase().includes(queryLower)) {
          results.push(turn);
        }
      }
    }

    return results;
  }

  /**
   * Get user preferences based on conversation history
   */
  getUserPreferences(): UserPreferences {
    const stored = this.getFromStorage<{
      commonTopics: [string, number][];
      commonIntents: [string, number][];
      preferredResponseStyle?: 'brief' | 'detailed' | 'conversational';
      averageSessionDuration?: number;
      lastInteractionTime?: string;
    }>(STORAGE_KEYS.USER_PREFERENCES);

    if (stored) {
      return {
        commonTopics: new Map(stored.commonTopics),
        commonIntents: new Map(stored.commonIntents),
        preferredResponseStyle: stored.preferredResponseStyle,
        averageSessionDuration: stored.averageSessionDuration,
        lastInteractionTime: stored.lastInteractionTime
          ? new Date(stored.lastInteractionTime)
          : undefined,
      };
    }

    // Default preferences
    return {
      commonTopics: new Map(),
      commonIntents: new Map(),
    };
  }

  /**
   * Get context-aware conversation instructions
   */
  getAdaptedInstructions(baseInstructions: string): string {
    const preferences = this.getUserPreferences();
    const recentTurns = this.getRecentTurns(5);

    let adaptedInstructions = baseInstructions;

    // Adapt based on common topics
    if (preferences.commonTopics.size > 0) {
      const topTopics = Array.from(preferences.commonTopics.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([topic]) => topic);

      if (topTopics.length > 0) {
        adaptedInstructions += `\n\nThe user frequently asks about: ${topTopics.join(', ')}.`;
      }
    }

    // Adapt based on response style preference
    if (preferences.preferredResponseStyle) {
      adaptedInstructions += `\n\nPrefer ${preferences.preferredResponseStyle} responses.`;
    }

    // Add recent context
    if (recentTurns.length > 0) {
      const recentContext = recentTurns
        .slice(-3)
        .map((turn) => `${turn.role}: ${turn.content}`)
        .join('\n');
      adaptedInstructions += `\n\nRecent conversation:\n${recentContext}`;
    }

    return adaptedInstructions;
  }

  /**
   * Update learning data based on session
   */
  private updateLearningData(session: ConversationSession): void {
    const preferences = this.getUserPreferences();

    // Update common topics and intents
    for (const turn of session.turns) {
      if (turn.metadata?.topics) {
        for (const topic of turn.metadata.topics) {
          const count = preferences.commonTopics.get(topic) || 0;
          preferences.commonTopics.set(topic, count + 1);
        }
      }

      if (turn.metadata?.intent) {
        const intent = turn.metadata.intent;
        const count = preferences.commonIntents.get(intent) || 0;
        preferences.commonIntents.set(intent, count + 1);
      }
    }

    // Update average session duration
    if (session.endTime) {
      const duration = session.endTime.getTime() - session.startTime.getTime();
      const sessions = this.getSessions();
      const totalDuration = sessions.reduce((sum, s) => {
        if (s.endTime) {
          return sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime());
        }
        return sum;
      }, duration);
      preferences.averageSessionDuration = totalDuration / (sessions.length + 1);
    }

    // Update last interaction time
    preferences.lastInteractionTime = new Date();

    // Detect preferred response style from user feedback patterns
    const userTurns = session.turns.filter((t) => t.role === 'user');
    if (userTurns.length > 5) {
      const avgLength = userTurns.reduce((sum, t) => sum + t.content.length, 0) / userTurns.length;
      if (avgLength < 30) {
        preferences.preferredResponseStyle = 'brief';
      } else if (avgLength > 100) {
        preferences.preferredResponseStyle = 'detailed';
      } else {
        preferences.preferredResponseStyle = 'conversational';
      }
    }

    // Save preferences
    this.saveToStorage(STORAGE_KEYS.USER_PREFERENCES, {
      commonTopics: Array.from(preferences.commonTopics.entries()),
      commonIntents: Array.from(preferences.commonIntents.entries()),
      preferredResponseStyle: preferences.preferredResponseStyle,
      averageSessionDuration: preferences.averageSessionDuration,
      lastInteractionTime: preferences.lastInteractionTime?.toISOString(),
    });
  }

  /**
   * Clear all conversation data (for privacy)
   */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.LEARNING_DATA);
    this.currentSession = null;
  }

  /**
   * Clear old sessions (keep only recent ones)
   */
  clearOldSessions(daysToKeep: number = 7): void {
    const sessions = this.getSessions();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const recentSessions = sessions.filter((session) => new Date(session.startTime) > cutoffDate);

    this.saveToStorage(STORAGE_KEYS.SESSIONS, recentSessions);
  }

  private saveToStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private getFromStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }
}

// Export singleton instance
export const conversationMemory = new ConversationMemoryService();
