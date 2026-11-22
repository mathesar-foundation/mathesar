import path from 'node:path';

import { env } from './env';

const instance = new URL(env.baseUrl).host.replace(/[^\w.-]/g, '_');

/**
 * Browser state of the signed-in admin, written by the setup project.
 * One file per instance, so that runs against two instances do not mix sessions.
 */
export const ADMIN_STORAGE_STATE = path.join(
  __dirname,
  '..',
  '.auth',
  `admin@${instance}.json`,
);
