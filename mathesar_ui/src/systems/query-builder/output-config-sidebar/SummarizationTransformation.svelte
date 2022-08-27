<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import GroupEntryComponent from '@mathesar/components/group-entry/GroupEntry.svelte';
  import type QuerySummarizationTransformationModel from '../QuerySummarizationTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../utils';

  const dispatch = createEventDispatcher();

  export let columns: ProcessedQueryResultColumnMap;
  export let model: QuerySummarizationTransformationModel;

  export let limitEditing = false;
</script>

<div>
  <GroupEntryComponent
    allowDelete={false}
    {columns}
    getColumnLabel={(column) =>
      (column && columns.get(column.id)?.column.display_name) ?? ''}
    disableColumnChange={limitEditing}
    bind:columnIdentifier={model.columnIdentifier}
    bind:preprocFunctionIdentifier={model.preprocFunctionIdentifier}
  />
</div>

<style lang="scss">
</style>
