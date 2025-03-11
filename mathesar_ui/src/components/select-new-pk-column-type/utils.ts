import Identity from './Identity.svelte';
import Uuid from './Uuid.svelte';

export const pkColumnTypeMap = {
  identity: {
    label: { component: Identity },
  },
  uuid: {
    label: { component: Uuid },
  },
};

export type NewPkColumnType = keyof typeof pkColumnTypeMap;
