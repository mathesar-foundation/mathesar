import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export const analytics = {
  get_state: rpcMethodTypeContainer<
    void,
    {
      enabled: boolean;
    }
  >(),

  initialize: rpcMethodTypeContainer<void, void>(),

  disable: rpcMethodTypeContainer<void, void>(),

  upload_feedback: rpcMethodTypeContainer<{ message: string }, void>(),
};
