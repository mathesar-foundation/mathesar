<script lang="ts">
  import SortEntryComponent from '@mathesar/components/sort-entry/SortEntry.svelte';
  import type QuerySortTransformationModel from '../../QuerySortTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../../utils';

  export let columns: ProcessedQueryResultColumnMap;
  export let model: QuerySortTransformationModel;

  export let limitEditing = false;
</script>

<SortEntryComponent
  allowDelete={false}
  {columns}
  getColumnLabel={(column) =>
    (column && columns.get(column.id)?.column.display_name) ?? ''}
  disableColumnChange={limitEditing}
  bind:columnIdentifier={model.columnIdentifier}
  bind:sortDirection={model.sortDirection}
  on:update
/>
