<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { FilterEntry as FilterEntryComponent } from '@mathesar/components/filter-entry';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type QueryFilterTransformationModel from '../../QueryFilterTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../../utils';

  const dispatch = createEventDispatcher();

  export let columns: ProcessedQueryResultColumnMap;
  export let model: QueryFilterTransformationModel;
  export let totalTransformations: number;

  export let limitEditing = false;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ processedColumns } = $tabularData);

  function updateFilter() {
    dispatch('update');
  }
</script>

<FilterEntryComponent
  allowDelete={false}
  {columns}
  getColumnLabel={(column) => columns.get(column.id)?.column.display_name ?? ''}
  getColumnConstraintType={(column) => {
    const linkFkType = $processedColumns.get(parseInt(column.id, 10))?.linkFk
      ?.type;
    return linkFkType ? [linkFkType] : undefined;
  }}
  disableColumnChange={limitEditing}
  layout="vertical"
  bind:columnIdentifier={model.columnIdentifier}
  bind:conditionIdentifier={model.conditionIdentifier}
  bind:value={model.value}
  numberOfFilters={totalTransformations}
  on:update={updateFilter}
/>
