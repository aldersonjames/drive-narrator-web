import type { Request, Response } from 'express';
import { z } from 'zod';

import type { ConversationService } from '../../services/voice/conversationService';
import type { PrivacyContext } from '../middleware/privacyMiddleware';
import { validate } from '../../utils/validation';

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

const conversationSchema = z.object({
  message: z.string().min(1),
  profileId: z.string().optional(),
  routeId: z.string().optional(),
  routeName: z.string().optional(),
  interestTags: z.union([z.array(z.string()), z.string()]).optional(),
});

export const createConversationController = (deps: Dependencies) => {
  return async function conversationController(req: Request, res: Response): Promise<Response> {
    const payload = validate(conversationSchema, req.body ?? {});
    const message = payload.message.trim();
    if (!message) {
      return res
        .status(400)
        .json({ code: 'INVALID_REQUEST', message: 'Traveler message is required.' });
    }

    const locals = res.locals as { privacy?: PrivacyContext };
    const profileId =
      locals?.privacy?.profileId ??
      (typeof payload.profileId === 'string' ? payload.profileId : undefined);

    const interestTags = toInterestArray(payload?.interestTags);
    const routeId = typeof payload?.routeId === 'string' ? payload.routeId : undefined;
    const routeName = typeof payload?.routeName === 'string' ? payload.routeName : undefined;

    const reply = deps.conversationService.generateReply({
      profileId,
      message,
      route: routeId || routeName ? { routeId, name: routeName } : undefined,
      interestTags,
    });

    return res.status(200).json(reply);
  };
};
