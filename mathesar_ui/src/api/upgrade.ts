import { postAPI } from './utils/requestUtils';

export const upgradeApi = {
  /** @throws Error for some very limited failure scenarios. */
  async upgrade(): Promise<void> {
    await postAPI('/api/ui/v0/upgrade/', {});
  },
};
