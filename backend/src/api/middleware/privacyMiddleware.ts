import type { Request, Response, NextFunction } from 'express';

import type { TravelerProfilesRepository } from '../../db/repositories/travelerProfilesRepository';

export interface PrivacyContext {
  profileId: string;
}

interface Dependencies {
  travelerProfilesRepo: Pick<TravelerProfilesRepository, 'findById'>;
  minimumConsentVersion?: string;
}

export const createPrivacyMiddleware = (deps: Dependencies) => {
  return async function privacyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const headerProfileId =
      (typeof req.headers['x-traveler-id'] === 'string' && req.headers['x-traveler-id']) ||
      (typeof req.headers['x-profile-id'] === 'string' && req.headers['x-profile-id']) ||
      undefined;

    const profileId =
      headerProfileId ??
      (typeof req.query.profileId === 'string' ? req.query.profileId : undefined) ??
      (typeof req.body?.profileId === 'string' ? req.body.profileId : undefined);

    if (!profileId) {
      res
        .status(403)
        .json({ code: 'PROFILE_REQUIRED', message: 'Traveler profile identifier is required.' });
      return;
    }

    const profile = await deps.travelerProfilesRepo.findById(profileId);
    if (!profile) {
      res.status(404).json({ code: 'PROFILE_NOT_FOUND', message: 'Traveler profile not found.' });
      return;
    }

    if (profile.deleted_at) {
      res.status(423).json({
        code: 'PROFILE_PENDING_DELETION',
        message: 'Traveler profile is pending deletion.',
      });
      return;
    }

    if (deps.minimumConsentVersion) {
      const currentVersion = profile.consent_version ?? '0';
      if (
        currentVersion.localeCompare(deps.minimumConsentVersion, undefined, { numeric: true }) < 0
      ) {
        res
          .status(428)
          .json({ code: 'CONSENT_UPDATE_REQUIRED', message: 'Traveler consent must be renewed.' });
        return;
      }
    }

    if (!res.locals || typeof res.locals !== 'object') {
      // eslint-disable-next-line no-param-reassign
      res.locals = {};
    }

    (res.locals as { privacy?: PrivacyContext }).privacy = { profileId };
    next();
  };
};
