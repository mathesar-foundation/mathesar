import { postAPI } from './utils/requestUtils';

export const reflectApi = {
  reflect(): Promise<void> {
    return postAPI('/api/ui/v0/reflect/', {});
  },
};
