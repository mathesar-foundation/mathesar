<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import GroupEntryComponent from '@mathesar/components/group-entry/GroupEntry.svelte';
  import type QuerySummarizationTransformationModel from '../QuerySummarizationTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../utils';

  const dispatch = createEventDispatcher();

  export let columns: ProcessedQueryResultColumnMap;
  export let model: QuerySummarizationTransformationModel;

  export let limitEditing = false;
  let { aggregations } = model;
  $: aggregations = model.aggregations;

  function updateGrouping(updateEventDetail: {
    preprocFunctionIdentifier?: string;
    columnIdentifier: string;
  }) {
    const { columnIdentifier, preprocFunctionIdentifier } = updateEventDetail;

    if (columnIdentifier !== model.columnIdentifier) {
      // recalculate agg columns
      aggregations = model.aggregations
        .without(columnIdentifier)
        .with(model.columnIdentifier, {
          inputAlias: model.columnIdentifier,
          outputAlias: `${model.columnIdentifier}_agg`,
          function: 'aggregate_to_array',
          displayName: model.columnIdentifier,
        });
      model.aggregations = aggregations;
    }
    model.columnIdentifier = columnIdentifier;
    model.preprocFunctionIdentifier = preprocFunctionIdentifier;
    dispatch('update', model);
  }
</script>

<div>
  <GroupEntryComponent
    allowDelete={false}
    {columns}
    getColumnLabel={(column) =>
      (column && columns.get(column.id)?.column.display_name) ?? ''}
    disableColumnChange={limitEditing}
    columnIdentifier={model.columnIdentifier}
    preprocFunctionIdentifier={model.preprocFunctionIdentifier}
    on:update={(e) => updateGrouping(e.detail)}
  />

  {#each [...aggregations.values()] as aggregation (aggregation.inputAlias)}
    <div>
      <div>{aggregation.inputAlias}</div>
      <div>
        {aggregation.function} : {aggregation.displayName}
      </div>
    </div>
  {/each}
</div>

<style lang="scss">
</style>
