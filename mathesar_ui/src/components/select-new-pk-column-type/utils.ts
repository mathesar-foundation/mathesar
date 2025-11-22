import Identity from './Identity.svelte';
import Uuid from './Uuid.svelte';

export const pkColumnTypeMap = {
  IDENTITY: {
    label: { component: Identity },
  },
  UUIDv4: {
    label: { component: Uuid },
  },
};

export type NewPkColumnType = keyof typeof pkColumnTypeMap;
