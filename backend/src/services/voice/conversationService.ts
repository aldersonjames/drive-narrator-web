import crypto from 'node:crypto';

import type {
  ConversationReplyPayload,
  ConversationAudioSegment,
  ConversationTurn,
} from '../../../../shared/types/tripNarrator';

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

export class ConversationService {
  generateReply(input: ConversationContextInput): ConversationReplyPayload {
    const message = input.message.trim();
    const now = new Date().toISOString();
    const replyId = crypto.randomUUID();

    const interestSummary = input.interestTags?.length
      ? ` with a focus on ${formatInterestList(input.interestTags.map(toTitleCase))}`
      : '';
    const routeSummary = input.route?.name ? ` along ${toTitleCase(input.route.name)}` : '';

    const enthusiasmHint =
      message.match(/\b(thank|excited|great|awesome)\b/i) !== null
        ? ` Love the energy${input.interestTags?.length ? ` around ${toTitleCase(input.interestTags[0])}` : ''}!`
        : '';

    const travelTip =
      input.route?.poiCount && input.route.poiCount >= 3
        ? ` I'll highlight at least ${Math.min(3, input.route.poiCount)} standout stops so nothing slips by.`
        : ' I will keep an eye out for standout stops to narrate in advance.';

    const assistantText =
      `Thanks for the update${enthusiasmHint}. Let's keep your trip${routeSummary}${interestSummary} humming. ` +
      `I'll prep narration beats that land before you reach each point of interest, and call out any rest or snack breaks that match your vibe. ${travelTip}`;

    const followUps = buildFollowUps(input.route?.name, input.interestTags);

    const audioSegments: ConversationAudioSegment[] = [
      {
        id: `${replyId}-segment`,
        voiceId: 'assistant-default',
        text: assistantText,
      },
    ];

    const turn: ConversationTurn = {
      id: replyId,
      role: 'assistant',
      voiceId: 'assistant-default',
      text: assistantText,
      createdAt: now,
      synopsis: 'Assistant guidance update',
    };

    return {
      turn,
      followUps,
      audioSegments,
    };
  }
}
