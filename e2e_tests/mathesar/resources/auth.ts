import { z } from 'zod';
import { defineResource } from '../../framework/src';

export const AuthSession = defineResource({
  type: 'auth-session',
  schema: z.object({
    username: z.string(),
    password: z.string(),
  }),
  key: (s) => s.username,
});
