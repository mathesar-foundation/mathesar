import { z } from 'zod';
import { defineResource } from '../../framework/src';

export const AppUser = defineResource({
  type: 'app-user',
  schema: z.object({
    username: z.string(),
    password: z.string(),
  }),
  key: (u) => u.username,
});
