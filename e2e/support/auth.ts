import path from 'node:path';

/** Browser state of the signed-in admin, written by the setup project. */
export const ADMIN_STORAGE_STATE = path.join(
  __dirname,
  '..',
  '.auth',
  'admin.json',
);
