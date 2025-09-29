import type { Request, Response } from 'express';

import type { ConversationService } from '../../services/voice/conversationService';
import type { PrivacyContext } from '../middleware/privacyMiddleware';

interface Dependencies {
  conversationService: ConversationService;
}

const toInterestArray = (value: unknown): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return undefined;
};

export const createConversationController = (deps: Dependencies) => {
  return async function conversationController(req: Request, res: Response): Promise<Response> {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) {
      return res
        .status(400)
        .json({ code: 'INVALID_REQUEST', message: 'Traveler message is required.' });
    }

    const locals = res.locals as { privacy?: PrivacyContext };
    const profileId =
      locals?.privacy?.profileId ??
      (typeof req.body?.profileId === 'string' ? req.body.profileId : undefined);

    const interestTags = toInterestArray(req.body?.interestTags);
    const routeId = typeof req.body?.routeId === 'string' ? req.body.routeId : undefined;
    const routeName = typeof req.body?.routeName === 'string' ? req.body.routeName : undefined;

    const reply = deps.conversationService.generateReply({
      profileId,
      message,
      route: routeId || routeName ? { routeId, name: routeName } : undefined,
      interestTags,
    });

    return res.status(200).json(reply);
  };
};
