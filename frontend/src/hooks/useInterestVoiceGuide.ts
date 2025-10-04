import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ConversationTurn } from '../../../shared/types/tripNarrator';
import type { BreathingOrbState } from '../components/voice/BreathingOrb';
import { VoiceOutputService } from '../services/voice/voiceOutputService';
import { useVoiceInput } from './useVoiceInput';
import type { VoiceInputStatus } from './useVoiceInput';

export interface GuidedOption {
  value: string;
  label: string;
  groupName?: string;
}

export interface UseInterestVoiceGuideOptions {
  options: GuidedOption[];
  selectedValues: string[];
  onAddValues: (values: string[]) => void;
  onRemoveValues?: (values: string[]) => void;
  prioritizeOrder?: string[];
}

export interface InterestVoiceGuideController {
  orbState: BreathingOrbState;
  transcript: string;
  conversation: ConversationTurn[];
  suggestions: string[];
  isProcessing: boolean;
  error?: string;
  micStatus: VoiceInputStatus;
  micError?: string;
  startVoice: () => void;
  stopVoice: () => void;
  sendText: (text: string) => Promise<void>;
  reset: () => void;
}

const STOP_PHRASES = [
  'no more',
  "that's all",
  'that is all',
  'nothing else',
  'we are good',
  'we are done',
  'finish',
  'done',
];

const REMOVE_PHRASES = ['remove', 'drop', 'clear', 'delete'];

const ACKNOWLEDGE_PHRASES = ['yes', 'sure', 'yeah', 'yep', 'ok', 'okay'];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'tourism.viewpoint': ['viewpoint', 'viewpoints', 'scenic', 'lookout', 'overlook', 'vista'],
  'leisure.park': ['park', 'parks', 'garden', 'gardens', 'greenspace'],
  'tourism.museum': ['museum', 'museums', 'exhibit'],
  'historic.memorial': ['historic', 'history', 'memorial', 'monument', 'heritage', 'fort', 'battlefield'],
  'amenity.restaurant': ['restaurant', 'restaurants', 'food', 'eat', 'diner', 'dinner'],
  'amenity.cafe': ['coffee', 'cafe', 'cafes', 'espresso', 'latte', 'tea'],
  'amenity.ice_cream': ['ice cream', 'gelato', 'dessert'],
  'amenity.microbrewery': ['brewery', 'breweries', 'beer', 'taproom'],
  'amenity.winery': ['winery', 'wineries', 'wine'],
  'leisure.hiking': ['hiking', 'trail', 'trails', 'hike', 'walk'],
  'natural.waterfall': ['waterfall', 'falls', 'cascade'],
  'tourism.artwork': ['art', 'artwork', 'mural', 'murals', 'statue'],
  'sport.stadium': ['stadium', 'stadiums', 'arena', 'arenas'],
  'amenity.theatre': ['theatre', 'theater', 'performance', 'playhouse'],
  'tourism.zoo': ['zoo', 'aquarium', 'animal park'],
  'shop.farm': ['farm', 'farm stand', 'farmers market', 'produce'],
};

const RECOMMENDATION_ORDER = [
  'tourism.viewpoint',
  'leisure.park',
  'tourism.museum',
  'historic.memorial',
  'amenity.restaurant',
  'amenity.cafe',
  'leisure.hiking',
  'natural.waterfall',
  'amenity.winery',
  'amenity.microbrewery',
  'tourism.artwork',
];

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const sanitize = (value: string): string => value.trim().toLowerCase();

const hasWord = (text: string, candidate: string): boolean => {
  if (!candidate) return false;
  const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|\\b)${escaped}(?:$|\\b)`);
  return regex.test(text);
};

const buildOptionKeywordMap = (options: GuidedOption[]): Map<string, string[]> => {
  return new Map(
    options.map((option) => {
      const keywords = new Set<string>();
      const baseLabel = option.label.toLowerCase();
      baseLabel
        .split(/\b|·|\//)
        .map((part) => part.trim())
        .filter((part) => part.length > 2)
        .forEach((part) => keywords.add(part));

      if (option.groupName) {
        option.groupName
          .toLowerCase()
          .split(/\s|\//)
          .filter((token) => token.length > 2)
          .forEach((token) => keywords.add(token));
      }

      const extra = CATEGORY_KEYWORDS[option.value];
      if (extra) {
        extra.forEach((keyword) => keywords.add(keyword.toLowerCase()));
      }

      return [option.value, Array.from(keywords)] as const;
    }),
  );
};

const buildSuggestionPrompts = (
  options: GuidedOption[],
  selected: Set<string>,
  order?: string[],
): string[] => {
  const labelMap = new Map(options.map((option) => [option.value, option.label]));
  const prioritized = order && order.length ? order : RECOMMENDATION_ORDER;
  const seen = new Set<string>();
  const results: string[] = [];

  const consider = (value: string) => {
    if (results.length >= 3) return;
    if (seen.has(value)) return;
    if (selected.has(value)) return;
    const label = labelMap.get(value);
    if (!label) return;
    results.push(`Add ${label}`);
    seen.add(value);
  };

  prioritized.forEach(consider);
  options
    .map((option) => option.value)
    .forEach(consider);

  return results.slice(0, 3);
};

export const useInterestVoiceGuide = (
  options: UseInterestVoiceGuideOptions,
): InterestVoiceGuideController => {
  const { options: guidedOptions, selectedValues, onAddValues, onRemoveValues, prioritizeOrder } = options;
  const [orbState, setOrbState] = useState<BreathingOrbState>('idle');
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    buildSuggestionPrompts(guidedOptions, new Set(selectedValues), prioritizeOrder),
  );
  const [isProcessing, setProcessing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const voiceOutputRef = useRef(
    new VoiceOutputService({
      onStart: () => setOrbState('speaking'),
      onEnd: () => setOrbState('idle'),
      onError: (_segment, err) => {
        setError(err.message);
        setOrbState('error');
      },
    }),
  );

  const awaitingResponseRef = useRef(false);
  const sequenceRef = useRef<Promise<void>>(Promise.resolve());
  const handleUtteranceRef = useRef<(details: { transcript: string; isFinal: boolean }) => void>(() => {});

  const keywordMap = useMemo(() => buildOptionKeywordMap(guidedOptions), [guidedOptions]);
  const labelMap = useMemo(
    () => new Map(guidedOptions.map((option) => [option.value, option.label])),
    [guidedOptions],
  );

  const appendTurn = useCallback((turn: ConversationTurn) => {
    setConversation((prev) => [...prev, turn]);
  }, []);

  const buildAssistantTurn = useCallback((text: string): ConversationTurn => {
    return {
      id: createId(),
      role: 'assistant',
      text,
      createdAt: new Date().toISOString(),
    };
  }, []);

  const voiceInput = useVoiceInput({
    continuous: false,
    interimResults: true,
    onTranscript: ({ transcript, isFinal }) => {
      if (!isFinal) {
        setOrbState('listening');
      }
      handleUtteranceRef.current({ transcript, isFinal });
    },
    onStatusChange: (status) => {
      if (status === 'listening') {
        setOrbState('listening');
      }
      if (status === 'idle' && awaitingResponseRef.current) {
        setOrbState('idle');
      }
    },
    onError: (message) => {
      setError(message);
      setOrbState('error');
      awaitingResponseRef.current = false;
    },
  });

  const speak = useCallback(
    (text: string, expectResponse = false) => {
      sequenceRef.current = sequenceRef.current
        .catch(() => undefined)
        .then(async () => {
          setProcessing(true);
          awaitingResponseRef.current = false;
          appendTurn(buildAssistantTurn(text));
          try {
            await voiceOutputRef.current.speak({
              id: createId(),
              text,
              voiceId: 'drive-narrator-guide',
            });
          } catch (err) {
            setError((err as Error).message);
            setOrbState('error');
            setProcessing(false);
            return;
          }

          setProcessing(false);

          if (expectResponse) {
            awaitingResponseRef.current = true;
            setOrbState('idle');
            voiceInput.reset();
            voiceInput.startListening();
          }
        });
    },
    [appendTurn, buildAssistantTurn, voiceInput],
  );

  const stopAll = useCallback(() => {
    awaitingResponseRef.current = false;
    voiceOutputRef.current.stop();
    voiceInput.stopListening();
    setProcessing(false);
    setOrbState('idle');
  }, [voiceInput]);

  const analyseUtterance = useCallback(
    (utterance: string) => {
      const text = sanitize(utterance);
      const wantsRemoval = REMOVE_PHRASES.some((phrase) => text.includes(phrase));
      const wantsToStop = STOP_PHRASES.some((phrase) => text.includes(phrase));

      const matchedValues = new Set<string>();

      keywordMap.forEach((keywords, value) => {
        if (keywords.some((keyword) => hasWord(text, keyword))) {
          matchedValues.add(value);
        }
      });

      if (!matchedValues.size) {
        // Try partial acknowledgement phrases like “yes, add museums”
        ACKNOWLEDGE_PHRASES.forEach((phrase) => {
          if (text.startsWith(`${phrase} `)) {
            const remainder = text.slice(phrase.length).trim();
            keywordMap.forEach((keywords, value) => {
              if (keywords.some((keyword) => hasWord(remainder, keyword))) {
                matchedValues.add(value);
              }
            });
          }
        });
      }

      return {
        wantsToStop,
        wantsRemoval,
        matches: Array.from(matchedValues),
      };
    },
    [keywordMap],
  );

  const handleResult = useCallback(
    async (rawInput: string) => {
      const input = rawInput.trim();
      if (!input) {
        speak(
          "I didn't catch that. Try saying something like 'Add scenic viewpoints' or 'Find local food.'",
          true,
        );
        return;
      }

      awaitingResponseRef.current = false;
      voiceInput.stopListening();
      setProcessing(true);

      appendTurn({
        id: createId(),
        role: 'traveler',
        text: input,
        createdAt: new Date().toISOString(),
      });

      const { matches, wantsRemoval, wantsToStop } = analyseUtterance(input);

      const selectedSet = new Set(selectedValues.map(sanitize));

      if (wantsRemoval && matches.length && onRemoveValues) {
        const toRemove = matches.filter((value) => selectedSet.has(sanitize(value)));
        if (toRemove.length) {
          onRemoveValues(toRemove);
          const labels = toRemove.map((value) => labelMap.get(value) ?? value);
          setSuggestions(buildSuggestionPrompts(guidedOptions, new Set(selectedValues), prioritizeOrder));
          setProcessing(false);
          speak(`No problem, removing ${labels.join(', ')}. Anything else?`, true);
          return;
        }
      }

      const uniqueMatches = Array.from(new Set(matches));
      const additions = uniqueMatches.filter((value) => !selectedSet.has(sanitize(value)));

      if (additions.length) {
        onAddValues(additions);
      }

      const updatedSelected = new Set(selectedValues);
      additions.forEach((value) => updatedSelected.add(value));
      const addedLabels = additions.map((value) => labelMap.get(value) ?? value);
      setSuggestions(buildSuggestionPrompts(guidedOptions, updatedSelected, prioritizeOrder));

      setProcessing(false);

      if (!additions.length && !wantsToStop) {
        speak(
          `I didn't connect that to a category. You can ask for museums, scenic viewpoints, or local food. Want to try another?`,
          true,
        );
        return;
      }

      if (wantsToStop) {
        if (additions.length) {
          speak(`Great, I added ${addedLabels.join(', ')}. You're all set!`, false);
        } else {
          speak("All right, you're ready to drive. You can reopen the voice guide anytime.", false);
        }
        return;
      }

      if (additions.length) {
        speak(`Great choice—added ${addedLabels.join(', ')}. Anything else you'd like to hear about?`, true);
      } else {
        speak("Sounds good. Anything else you want me to watch for?", true);
      }
    },
    [
      analyseUtterance,
      appendTurn,
      guidedOptions,
      labelMap,
      onAddValues,
      onRemoveValues,
      prioritizeOrder,
      selectedValues,
      speak,
      voiceInput,
    ],
  );

  useEffect(() => {
    handleUtteranceRef.current = ({ transcript, isFinal }) => {
      if (!awaitingResponseRef.current) return;
      if (!isFinal) return;
      awaitingResponseRef.current = false;
      void handleResult(transcript);
    };
  }, [handleResult]);

  const startVoice = useCallback(() => {
    stopAll();
    setConversation([]);
    setSuggestions(buildSuggestionPrompts(guidedOptions, new Set(selectedValues), prioritizeOrder));
    setError(undefined);
    speak(
      "Let's tune your drive. Tell me the kinds of places you want—say things like scenic viewpoints, museums, or legendary food stops.",
      true,
    );
  }, [guidedOptions, prioritizeOrder, selectedValues, speak, stopAll]);

  const stopVoice = useCallback(() => {
    stopAll();
  }, [stopAll]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      stopAll();
      await handleResult(trimmed);
    },
    [handleResult, stopAll],
  );

  const reset = useCallback(() => {
    stopAll();
    setConversation([]);
    setSuggestions(buildSuggestionPrompts(guidedOptions, new Set(selectedValues), prioritizeOrder));
    setError(undefined);
  }, [guidedOptions, prioritizeOrder, selectedValues, stopAll]);

  const transcript = voiceInput.status === 'listening' ? voiceInput.transcript : '';

  return {
    orbState,
    transcript,
    conversation,
    suggestions,
    isProcessing,
    error,
    micStatus: voiceInput.status,
    micError: voiceInput.error,
    startVoice,
    stopVoice,
    sendText,
    reset,
  };
};

export default useInterestVoiceGuide;
