<script lang="ts">
  import type { ConstraintType } from '@mathesar/api/rpc/constraints';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import type { ReadableMapLike } from '@mathesar/typeUtils';

  import FilterEntry from './FilterEntry.svelte';
  import type { FilterEntryColumn, IndividualFilter } from './utils';

  export let columns: ReadableMapLike<
    FilterEntryColumn['id'],
    FilterEntryColumn
  >;
  export let getColumnLabel: (column: FilterEntryColumn) => string;
  export let getColumnConstraintType: (
    column: FilterEntryColumn,
  ) => ConstraintType[] | undefined = () => undefined;
  export let recordSummaries: AssociatedCellData<string>;

  export let individualFilter: IndividualFilter;
  $: ({ columnId, conditionId, value } = individualFilter);
</script>

<FilterEntry
  {columns}
  {getColumnLabel}
  {getColumnConstraintType}
  recordSummaryStore={recordSummaries}
  bind:columnIdentifier={$columnId}
  bind:conditionIdentifier={$conditionId}
  bind:value={$value}
  on:update
>
  <slot />
</FilterEntry>
