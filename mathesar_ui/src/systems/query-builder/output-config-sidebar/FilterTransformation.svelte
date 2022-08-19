<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { FilterEntry as FilterEntryComponent } from '@mathesar/components/filter-entry';
  import type QueryFilterTransformationModel from '../QueryFilterTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../utils';

  const dispatch = createEventDispatcher();

  export let processedQueryColumns: ProcessedQueryResultColumnMap;
  export let allTransformableColumns: ProcessedQueryResultColumnMap;
  export let model: QueryFilterTransformationModel;

  export let limitEditing = false;

  $: columns = limitEditing
    ? [...allTransformableColumns.values()]
    : [...processedQueryColumns.values()];

  function updateFilter() {
    dispatch('update');
  }
</script>

<FilterEntryComponent
  allowDelete={false}
  {columns}
  getColumnLabel={(column) =>
    allTransformableColumns.get(column.id)?.column.display_name ?? ''}
  disableColumnChange={limitEditing}
  layout="vertical"
  bind:columnIdentifier={model.columnIdentifier}
  bind:conditionIdentifier={model.conditionIdentifier}
  bind:value={model.value}
  on:update={updateFilter}
/>

<style lang="scss">
</style>
