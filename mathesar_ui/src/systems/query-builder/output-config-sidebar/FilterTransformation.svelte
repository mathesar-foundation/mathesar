<script lang="ts">
  import { FilterEntry as FilterEntryComponent } from '@mathesar/components/filter-entry';
  import type QueryFilterTransformationModel from '../QueryFilterTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../utils';

  export let processedQueryColumns: ProcessedQueryResultColumnMap;
  export let allTransformableColumns: ProcessedQueryResultColumnMap;
  export let model: QueryFilterTransformationModel;

  export let limitEditing = false;

  $: columns = limitEditing
    ? [...allTransformableColumns.values()]
    : [...processedQueryColumns.values()];
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
  on:update
/>

<style lang="scss">
</style>
