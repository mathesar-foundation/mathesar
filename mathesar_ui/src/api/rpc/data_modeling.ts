import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const data_modeling = {
  /**
   * Returns a record where keys are stringified column attnums and values are
   * postgresql types
   */
  suggest_types: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
    },
    Record<string, string>
  >(),
};
