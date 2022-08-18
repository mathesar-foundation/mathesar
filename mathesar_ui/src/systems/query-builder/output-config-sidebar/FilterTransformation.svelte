<script lang="ts">
  import { FilterEntry as FilterEntryComponent } from '@mathesar/components/filter-entry';
  import type QueryFilterTransformationModel from '../QueryFilterTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../QueryManager';

  export let processedQueryColumns: ProcessedQueryResultColumnMap;
  export let processedQueryColumnHistory: ProcessedQueryResultColumnMap;
  export let model: QueryFilterTransformationModel;

  export let limitEditing = false;

  $: columns = limitEditing
    ? [...processedQueryColumnHistory.values()]
    : [...processedQueryColumns.values()];
</script>

<FilterEntryComponent
  allowDelete={false}
  {columns}
  getColumnLabel={(column) =>
    processedQueryColumnHistory.get(column.id)?.column.display_name ?? ''}
  disableColumnChange={limitEditing}
  layout="vertical"
  bind:columnIdentifier={model.columnIdentifier}
  bind:conditionIdentifier={model.conditionIdentifier}
  bind:value={model.value}
  on:update
/>

<style lang="scss">
</style>
