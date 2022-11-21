<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import GroupEntryComponent from '@mathesar/components/group-entry/GroupEntry.svelte';
  import type QuerySummarizationTransformationModel from '../../../QuerySummarizationTransformationModel';
  import type {
    ProcessedQueryResultColumn,
    ProcessedQueryResultColumnMap,
  } from '../../../utils';
  import Aggregation from './Aggregation.svelte';

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
          displayName: `${model.columnIdentifier}_agg`,
        });
      model.aggregations = aggregations;
    }
    model.columnIdentifier = columnIdentifier;
    model.preprocFunctionIdentifier = preprocFunctionIdentifier;
    dispatch('update', model);
  }

  function includeColumnForAggregation(
    processedColumn: ProcessedQueryResultColumn,
  ) {
    aggregations = model.aggregations.with(processedColumn.id, {
      inputAlias: processedColumn.id,
      outputAlias: `${processedColumn.id}_agg`,
      function: 'aggregate_to_array',
      displayName: `${processedColumn.id}_agg`,
    });
    model.aggregations = aggregations;
    dispatch('update', model);
  }

  function excludeColumnFromAggregation(
    processedColumn: ProcessedQueryResultColumn,
  ) {
    aggregations = model.aggregations.without(processedColumn.id);
    model.aggregations = aggregations;
    dispatch('update', model);
  }
</script>

<div class="summarization">
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
  <div class="aggregations">
    <header>Aggregate</header>
    {#each [...columns
        .without(model.columnIdentifier)
        .values()] as processedColumn (processedColumn.id)}
      <Aggregation
        {processedColumn}
        aggregation={aggregations.get(processedColumn.id)}
        on:include={() => includeColumnForAggregation(processedColumn)}
        on:exclude={() => excludeColumnFromAggregation(processedColumn)}
        on:update
      />
    {/each}
  </div>
</div>

<style lang="scss">
  .summarization {
    .aggregations {
      margin-top: 0.6rem;
    }
  }
</style>
