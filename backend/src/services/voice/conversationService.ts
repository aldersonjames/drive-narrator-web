import crypto from 'node:crypto';

import OpenAI from 'openai';

import type {
  ConversationReplyPayload,
  ConversationAudioSegment,
  ConversationTurn,
  PreferencesMetadata,
} from '../../../../shared/types/tripNarrator';
import { DEFAULT_PERSONA_ID, NARRATOR_PERSONAS } from '../../../../shared/data/narratorPersonas';
import type { TravelerProfileRecord } from '../../db/repositories/travelerProfilesRepository';

export interface ConversationContextInput {
  profileId?: string;
  message: string;
  route?: {
    routeId?: string;
    name?: string;
    distanceKm?: number;
    durationMinutes?: number;
    poiCount?: number;
  };
  interestTags?: string[];
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const CHAT_MODEL = process.env.NARRATOR_MODEL ?? 'gpt-4o-mini';
const DEFAULT_VOICE_ID = 'nova';

const toTitleCase = (value: string): string =>
  value
    .split(/\s+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const formatInterestList = (interestTags: string[]): string => {
  if (!interestTags.length) return '';
  if (interestTags.length === 1) return interestTags[0];
  const head = interestTags.slice(0, -1).join(', ');
  const tail = interestTags[interestTags.length - 1];
  return `${head} and ${tail}`;
};

const buildFollowUps = (routeName?: string, interestTags?: string[]): string[] => {
  const root: string[] = [];
  if (interestTags && interestTags.length) {
    const interest = interestTags[0];
    root.push(`Find another stop that matches ${interest}`);
    root.push(`Are there family-friendly spots that also touch on ${interest}?`);
  }
  if (routeName) {
    root.push(`How does ${routeName} compare to the other routes?`);
  }
  if (!root.length) {
    root.push('Share a safety tip for the next leg');
    root.push('Recommend a snack stop nearby');
  }
  return root.slice(0, 3);
};

const parseMetadata = (raw: string | null): PreferencesMetadata => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PreferencesMetadata) : {};
  } catch {
    return {};
  }
};

export interface ConversationServiceDependencies {
  profilesRepo: {
    findById(profileId: string): Promise<TravelerProfileRecord | undefined>;
  };
}

export class ConversationService {
  constructor(private readonly deps: ConversationServiceDependencies) {}

  async generateReply(input: ConversationContextInput): Promise<ConversationReplyPayload> {
    const message = input.message.trim();
    const now = new Date().toISOString();
    const replyId = crypto.randomUUID();

    const profile = input.profileId
      ? await this.deps.profilesRepo.findById(input.profileId)
      : undefined;

    const metadata = profile ? parseMetadata(profile.metadata) : {};
    const personaId =
      (metadata.narrationPersonaId as string | undefined) ?? DEFAULT_PERSONA_ID;
    const persona =
      NARRATOR_PERSONAS.find((entry) => entry.id === personaId) ??
      NARRATOR_PERSONAS.find((entry) => entry.id === DEFAULT_PERSONA_ID) ??
      NARRATOR_PERSONAS[0];

    const voiceId = profile?.narration_voice_id ?? DEFAULT_VOICE_ID;

    const contextLines: string[] = [];
    if (input.route?.name) {
      contextLines.push(`Current route: ${toTitleCase(input.route.name)}.`);
    }
    if (input.interestTags?.length) {
      contextLines.push(
        `Interests we are tracking: ${formatInterestList(
          input.interestTags.map(toTitleCase),
        )}.`,
      );
    }
    if (input.route?.poiCount) {
      contextLines.push(`There are ${input.route.poiCount} notable points of interest ahead.`);
    }

    const userContent = [message, contextLines.join(' ')].filter(Boolean).join('\n\n');

    let assistantText: string | undefined;

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: CHAT_MODEL,
          temperature: 0.75,
          messages: [
            { role: 'system', content: persona.instructions },
            { role: 'user', content: userContent },
          ],
        });

        assistantText = completion.choices[0]?.message?.content?.trim();
      } catch (error) {
        console.error('conversation-service: chat completion failed', error);
      }
    }

    if (!assistantText) {
      const interestSummary = input.interestTags?.length
        ? ` with a focus on ${formatInterestList(input.interestTags.map(toTitleCase))}`
        : '';
      const routeSummary = input.route?.name ? ` along ${toTitleCase(input.route.name)}` : '';
      assistantText =
        `I'm right here with you${routeSummary}${interestSummary}. ` +
        `Even without the full storyteller mode online, I'll keep spotting highlights and checking in so this drive stays special.`;
    }

    const followUps = buildFollowUps(input.route?.name, input.interestTags);

    const audioSegments: ConversationAudioSegment[] = [
      {
        id: `${replyId}-segment`,
        voiceId,
        text: assistantText,
      },
    ];

    const turn: ConversationTurn = {
      id: replyId,
      role: 'assistant',
      voiceId,
      text: assistantText,
      createdAt: now,
      synopsis: persona.name,
    };

    return {
      turn,
      followUps,
      audioSegments,
    };
  }
}
