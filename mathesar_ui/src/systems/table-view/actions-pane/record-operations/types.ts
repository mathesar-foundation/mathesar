import type { SortDirection } from "@mathesar/stores/table-data";

export type SortEntryEvents = {
  remove: number;
  update: {
    columnId: number | undefined;
    direction: SortDirection;
  };
};