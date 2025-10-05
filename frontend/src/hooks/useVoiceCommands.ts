import { useState, useCallback, useRef } from 'react';

export interface VoiceCommand {
  type: string;
  action: string;
  parameters: Record<string, string>;
  confidence: number;
  originalText: string;
  intent?: string;
}

export interface VoiceCommandHandler {
  (command: VoiceCommand): void;
}

interface VoiceCommandOptions {
  onCommand?: VoiceCommandHandler;
  onError?: (error: string) => void;
  wakeWords?: string[];
  commandTimeout?: number;
}

interface CommandPattern {
  pattern: RegExp;
  type: string;
  action: string;
  parameters: Record<string, string>;
}

const COMMAND_PATTERNS: CommandPattern[] = [
  // Drive control commands
  {
    pattern: /(start|begin|go)\s+(my\s+)?drive/i,
    type: 'drive',
    action: 'start',
    parameters: {},
  },
  {
    pattern: /(pause|stop)\s+(my\s+)?drive/i,
    type: 'drive',
    action: 'pause',
    parameters: {},
  },
  {
    pattern: /(resume|continue)\s+(my\s+)?drive/i,
    type: 'drive',
    action: 'resume',
    parameters: {},
  },
  {
    pattern: /(end|finish|complete)\s+(my\s+)?drive/i,
    type: 'drive',
    action: 'end',
    parameters: {},
  },
  {
    pattern: /save\s+(this\s+)?drive/i,
    type: 'drive',
    action: 'save',
    parameters: {},
  },

  // POI and interest commands
  {
    pattern: /add\s+(.+?)(?:\s+as\s+interest)?$/i,
    type: 'interest',
    action: 'add',
    parameters: { interest: '$1' },
  },
  {
    pattern: /remove\s+(.+?)(?:\s+from\s+interests)?$/i,
    type: 'interest',
    action: 'remove',
    parameters: { interest: '$1' },
  },
  {
    pattern: /what\s+(am\s+i\s+)?interested\s+in/i,
    type: 'interest',
    action: 'list',
    parameters: {},
  },
  {
    pattern: /tell\s+me\s+about\s+(.+)/i,
    type: 'poi',
    action: 'info',
    parameters: { poi: '$1' },
  },
  {
    pattern: /skip\s+(this\s+)?(one|poi)/i,
    type: 'poi',
    action: 'skip',
    parameters: {},
  },
  {
    pattern: /mark\s+(as\s+)?favorite/i,
    type: 'poi',
    action: 'favorite',
    parameters: {},
  },

  // Voice and settings commands
  {
    pattern: /change\s+(my\s+)?voice/i,
    type: 'voice',
    action: 'change',
    parameters: {},
  },
  {
    pattern: /change\s+(my\s+)?persona/i,
    type: 'voice',
    action: 'change_persona',
    parameters: {},
  },
  {
    pattern: /what'?s\s+my\s+current\s+voice/i,
    type: 'voice',
    action: 'status',
    parameters: {},
  },
  {
    pattern: /set\s+alert\s+time\s+to\s+(\d+)\s+minutes?/i,
    type: 'settings',
    action: 'set_alert_time',
    parameters: { minutes: '$1' },
  },
  {
    pattern: /(increase|decrease)\s+alert\s+time/i,
    type: 'settings',
    action: 'adjust_alert_time',
    parameters: { direction: '$1' },
  },
  {
    pattern: /what\s+are\s+my\s+settings/i,
    type: 'settings',
    action: 'status',
    parameters: {},
  },

  // Conversational commands
  {
    pattern: /what'?s\s+coming\s+up/i,
    type: 'conversation',
    action: 'upcoming',
    parameters: {},
  },
  {
    pattern: /tell\s+me\s+a\s+story/i,
    type: 'conversation',
    action: 'story',
    parameters: {},
  },
  {
    pattern: /what'?s\s+interesting\s+around\s+here/i,
    type: 'conversation',
    action: 'local_info',
    parameters: {},
  },
  {
    pattern: /repeat\s+(that|last)/i,
    type: 'conversation',
    action: 'repeat',
    parameters: {},
  },
  {
    pattern: /speak\s+(slower|faster)/i,
    type: 'conversation',
    action: 'adjust_speed',
    parameters: { speed: '$1' },
  },
  {
    pattern: /(volume\s+)?(up|down)/i,
    type: 'conversation',
    action: 'adjust_volume',
    parameters: { direction: '$2' },
  },

  // System commands
  {
    pattern: /help/i,
    type: 'system',
    action: 'help',
    parameters: {},
  },
  {
    pattern: /what\s+can\s+you\s+do/i,
    type: 'system',
    action: 'capabilities',
    parameters: {},
  },
  {
    pattern: /open\s+settings/i,
    type: 'system',
    action: 'open_settings',
    parameters: {},
  },
  {
    pattern: /show\s+me\s+the\s+map/i,
    type: 'system',
    action: 'show_map',
    parameters: {},
  },
];

export const useVoiceCommands = (options: VoiceCommandOptions = {}) => {
  const {
    onCommand,
    onError,
    wakeWords = ['hey drive narrator', 'drive narrator', 'narrate my drive'],
    commandTimeout = 5000,
  } = options;

  const [isAwake, setIsAwake] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processTranscript = useCallback(
    (transcript: string, confidence: number) => {
      const text = transcript.toLowerCase().trim();

      // Check for wake words
      const hasWakeWord = wakeWords.some((wakeWord) => text.includes(wakeWord.toLowerCase()));

      if (hasWakeWord && !isAwake) {
        setIsAwake(true);
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        // Set timeout to go back to sleep
        timeoutRef.current = setTimeout(() => {
          setIsAwake(false);
        }, commandTimeout);
        return;
      }

      if (!isAwake) return;

      // Remove wake words from the text for command processing
      let commandText = text;
      wakeWords.forEach((wakeWord) => {
        commandText = commandText.replace(wakeWord.toLowerCase(), '').trim();
      });

      // Find matching command pattern
      for (const pattern of COMMAND_PATTERNS) {
        const match = commandText.match(pattern.pattern);
        if (match) {
          const command: VoiceCommand = {
            type: pattern.type,
            action: pattern.action,
            parameters: { ...pattern.parameters },
            confidence,
            originalText: transcript,
          };

          // Replace parameter placeholders with actual values
          Object.keys(command.parameters).forEach((key) => {
            const value = command.parameters[key];
            if (typeof value === 'string' && value.startsWith('$')) {
              const index = parseInt(value.substring(1)) - 1;
              command.parameters[key] = match[index + 1] || '';
            }
          });

          setLastCommand(command);
          onCommand?.(command);

          // Reset wake state after command
          setIsAwake(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          return;
        }
      }

      // No command matched
      onError?.(`Command not recognized: "${transcript}"`);
    },
    [isAwake, wakeWords, commandTimeout, onCommand, onError],
  );

  const wakeUp = useCallback(() => {
    setIsAwake(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsAwake(false);
    }, commandTimeout);
  }, [commandTimeout]);

  const sleep = useCallback(() => {
    setIsAwake(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const clearLastCommand = useCallback(() => {
    setLastCommand(null);
  }, []);

  return {
    isAwake,
    lastCommand,
    processTranscript,
    wakeUp,
    sleep,
    clearLastCommand,
  };
};
