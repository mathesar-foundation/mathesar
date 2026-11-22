import { test as teardown } from '@playwright/test';

import { MathesarApi } from '../../support/api/mathesar';

teardown('drop the roles of this run', async () => {
  const api = await MathesarApi.asAdmin();
  try {
    await api.dropRolesOfRun();
  } finally {
    await api.dispose();
  }
});
