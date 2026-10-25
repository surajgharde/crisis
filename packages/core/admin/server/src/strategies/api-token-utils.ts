import type { Context } from 'koa';

import { isAfter, parseISO, subHours } from 'date-fns';
import { errors } from '@strapi/utils';

const { UnauthorizedError } = errors;

export const extractToken = (ctx: Context): string | null => {
  if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
    const parts = ctx.request.header.authorization.split(/\s+/);

    if (parts[0].toLowerCase() !== 'bearer' || parts.length !== 2) {
      return null;
    }

    return parts[1];
  }

  return null;
};

export const checkExpiry = (apiToken: {
  expiresAt?: string | number | null;
}): InstanceType<typeof UnauthorizedError> | null => {
  if (apiToken.expiresAt != null) {
    const expirationDate = new Date(apiToken.expiresAt);
    if (expirationDate < new Date()) {
      return new UnauthorizedError('Token expired');
    }
  }

  return null;
};

const LAST_USED_REFRESH_INTERVAL_IN_HOURS = 1;

export const updateLastUsedAt = async (apiToken: {
  id: number | string;
  lastUsedAt?: string | null;
}): Promise<void> => {
  const currentDate = new Date();
  const lastUsedAt = apiToken.lastUsedAt != null ? parseISO(apiToken.lastUsedAt) : null;

  // The timestamp is refreshed at most once an hour: the current window opened an
  // hour ago, so only a timestamp written inside it is still fresh enough to keep.
  const windowOpenedAt = subHours(currentDate, LAST_USED_REFRESH_INTERVAL_IN_HOURS);

  if (lastUsedAt !== null && isAfter(lastUsedAt, windowOpenedAt)) {
    return;
  }

  await strapi.db.query('admin::api-token').update({
    where: { id: apiToken.id },
    data: { lastUsedAt: currentDate },
  });
};
