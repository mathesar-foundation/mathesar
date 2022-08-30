<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Select,
    TextInput,
    LabeledInput,
    Checkbox,
  } from '@mathesar-component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import type { QuerySummarizationAggregationEntry } from '../../QuerySummarizationTransformationModel';
  import type { ProcessedQueryResultColumn } from '../../utils';

  const dispatch = createEventDispatcher();

  export let processedColumn: ProcessedQueryResultColumn;
  export let aggregation: QuerySummarizationAggregationEntry | undefined;

  function getAggregationTypeLabel(aggType?: string) {
    switch (aggType) {
      case 'aggregate_to_array':
        return 'List';
      case 'count':
        return 'Count';
      default:
        return '';
    }
  }

  function includeExcludeAggregation(isAggregated: boolean) {
    if (isAggregated) {
      dispatch('include');
    } else {
      dispatch('exclude');
    }
  }
</script>

<div class="aggregation">
  <header>
    <LabeledInput layout="inline-input-first">
      <Checkbox
        checked={!!aggregation}
        on:change={(e) => includeExcludeAggregation(e.detail)}
      />
      <ColumnName
        slot="label"
        column={{
          ...processedColumn.column,
          name:
            processedColumn.column.display_name ?? processedColumn.column.alias,
        }}
      />
    </LabeledInput>
  </header>
  {#if aggregation}
    <div class="content">
      <LabeledInput label="as" layout="stacked">
        <Select
          options={['aggregate_to_array', 'count']}
          bind:value={aggregation.function}
          getLabel={getAggregationTypeLabel}
        />
      </LabeledInput>

      <LabeledInput label="with display name" layout="stacked">
        <TextInput bind:value={aggregation.displayName} />
      </LabeledInput>
    </div>
  {/if}
</div>

<style lang="scss">
  .aggregation {
    margin: 0.8rem 0 0 0.3rem;

    .content {
      margin: 0.5rem 0 0.4rem 1rem;

      :global(.labeled-input + .labeled-input) {
        margin-top: 0.5rem;
      }
    }
  }
</style>
