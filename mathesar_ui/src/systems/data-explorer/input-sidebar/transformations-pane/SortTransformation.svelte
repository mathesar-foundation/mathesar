<script lang="ts">
  import SortEntryComponent from '@mathesar/components/sort-entry/SortEntry.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type QuerySortTransformationModel from '../../QuerySortTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../../utils';

  export let columns: ProcessedQueryResultColumnMap;
  export let model: QuerySortTransformationModel;
  export let columnsAllowedForSelection: string[];

  export let limitEditing = false;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ processedColumns } = $tabularData);
</script>

<SortEntryComponent
  allowDelete={false}
  {columns}
  {columnsAllowedForSelection}
  getColumnLabel={(column) =>
    (column && columns.get(column.id)?.column.display_name) ?? ''}
  getColumnConstraintType={(column) => {
    const linkFkType = $processedColumns.get(parseInt(column.id, 10))?.linkFk
      ?.type;
    return linkFkType ? [linkFkType] : undefined;
  }}
  disableColumnChange={limitEditing}
  bind:columnIdentifier={model.columnIdentifier}
  bind:sortDirection={model.sortDirection}
  on:update
/>
