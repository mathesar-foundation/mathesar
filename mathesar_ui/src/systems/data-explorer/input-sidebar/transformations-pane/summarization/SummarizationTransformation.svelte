<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import GroupEntryComponent from '@mathesar/components/group-entry/GroupEntry.svelte';
  import {
    ImmutableMap,
    LabeledInput,
    MultiSelect,
  } from '@mathesar-component-library';

  import type {
    QuerySummarizationAggregationEntry,
    QuerySummarizationTransformationModel,
  } from '../../../QuerySummarizationTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../../../utils';

  import Aggregation from './Aggregation.svelte';

  const dispatch = createEventDispatcher();

  export let columns: ProcessedQueryResultColumnMap;
  export let model: QuerySummarizationTransformationModel;

  export let limitEditing = false;
  $: ({ aggregations, groups } = model);

  function updateGrouping(updateEventDetail: {
    preprocFunctionIdentifier?: string;
    columnIdentifier: string;
  }) {
    const { columnIdentifier, preprocFunctionIdentifier } = updateEventDetail;

    if (columnIdentifier !== model.columnIdentifier) {
      // guess everything again
      groups = new ImmutableMap();
      aggregations = new ImmutableMap();
      model.aggregations = aggregations;
      model.groups = groups;
    }
    model.columnIdentifier = columnIdentifier;
    model.preprocFunctionIdentifier = preprocFunctionIdentifier;
    dispatch('update', model);
  }

  function onGroupChange(values: string[]) {
    let newAggregations = aggregations;
    const valueSet = new Set(values);
    [...columns.values()].forEach((processedColumn) => {
      const pcAlias = processedColumn.column.alias;
      if (!valueSet.has(pcAlias) && model.columnIdentifier !== pcAlias) {
        newAggregations = newAggregations.with(pcAlias, {
          inputAlias: pcAlias,
          outputAlias: `${pcAlias}_agged`,
          function: 'distinct_aggregate_to_array',
        });
      }
    });
    aggregations = newAggregations;
    groups = new ImmutableMap(
      values.map((columnAlias) => [
        columnAlias,
        {
          inputAlias: columnAlias,
          outputAlias: `${columnAlias}_group`,
        },
      ]),
    );
    model.aggregations = aggregations;
    model.groups = groups;
    dispatch('update', model);
  }

  function removeAggregation(aggEntry: QuerySummarizationAggregationEntry) {
    groups = groups.with(aggEntry.inputAlias, {
      inputAlias: aggEntry.inputAlias,
      outputAlias: `${aggEntry.inputAlias}_group`,
    });
    aggregations = aggregations.without(aggEntry.inputAlias);
    model.groups = groups;
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
  {#if groups.size > 0}
    <section>
      <LabeledInput label={$_('not_aggregated')} layout="stacked">
        <MultiSelect
          values={[...groups.values()].map((entry) => entry.inputAlias)}
          options={[...columns.without(model.columnIdentifier).values()].map(
            (entry) => entry.column.alias,
          )}
          on:change={(e) => onGroupChange(e.detail)}
          autoClearInvalidValues={false}
          disabled={limitEditing}
          let:option
        >
          {@const columnInfo = columns.get(option)?.column}
          <ColumnName
            column={{
              name: columnInfo?.display_name ?? '',
              type: columnInfo?.type ?? 'unknown',
              type_options: columnInfo?.type_options ?? null,
            }}
          />
        </MultiSelect>
      </LabeledInput>
    </section>
  {/if}
  {#if aggregations.size > 0}
    <section>
      <header>{$_('aggregate')}</header>
      {#each [...aggregations.values()] as aggregation (aggregation.inputAlias)}
        <Aggregation
          processedColumn={columns.get(aggregation.inputAlias)}
          {aggregation}
          {limitEditing}
          on:update
          on:remove={() => removeAggregation(aggregation)}
        />
      {/each}
    </section>
  {/if}
</div>

<style lang="scss">
  .summarization {
    section {
      margin-top: 0.6rem;
    }
  }
</style>
