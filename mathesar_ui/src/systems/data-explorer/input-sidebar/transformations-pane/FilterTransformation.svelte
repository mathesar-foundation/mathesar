<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import FilterEntryComponent from '@mathesar/components/filter/FilterEntry.svelte';

  import type QueryFilterTransformationModel from '../../QueryFilterTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../../utils';

  const dispatch = createEventDispatcher();

  export let columns: ProcessedQueryResultColumnMap;
  export let model: QueryFilterTransformationModel;
  export let totalTransformations: number;

  export let limitEditing = false;

  function updateFilter() {
    dispatch('update');
  }
</script>

<FilterEntryComponent
  {columns}
  getColumnLabel={(column) => columns.get(column.id)?.column.display_name ?? ''}
  disableColumnChange={limitEditing}
  layout="vertical"
  bind:columnIdentifier={model.columnIdentifier}
  bind:conditionIdentifier={model.conditionIdentifier}
  bind:value={model.value}
  numberOfFilters={totalTransformations}
  on:update={updateFilter}
/>
