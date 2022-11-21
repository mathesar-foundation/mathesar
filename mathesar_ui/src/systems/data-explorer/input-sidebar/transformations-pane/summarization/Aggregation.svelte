<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Select,
    TextInput,
    LabeledInput,
    Debounce,
    getValueFromEvent,
  } from '@mathesar-component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import type { QuerySummarizationAggregationEntry } from '../../../QuerySummarizationTransformationModel';
  import type { ProcessedQueryResultColumn } from '../../../utils';

  const dispatch = createEventDispatcher();

  export let processedColumn: ProcessedQueryResultColumn | undefined;
  export let aggregation: QuerySummarizationAggregationEntry;

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
</script>

<div class="aggregation">
  <header>
    {#if processedColumn}
      <ColumnName
        column={{
          ...processedColumn.column,
          name:
            processedColumn.column.display_name ?? processedColumn.column.alias,
        }}
      />
    {:else}
      {aggregation.inputAlias}
    {/if}
  </header>
  <div class="content">
    <LabeledInput label="as" layout="stacked">
      <Select
        options={['aggregate_to_array', 'count']}
        bind:value={aggregation.function}
        getLabel={getAggregationTypeLabel}
        on:change={() => dispatch('update')}
      />
    </LabeledInput>

    <LabeledInput label="with display name" layout="stacked">
      <Debounce
        bind:value={aggregation.displayName}
        let:handleNewValue
        on:artificialInput={() => dispatch('update')}
      >
        <TextInput
          value={aggregation.displayName}
          on:input={(e) =>
            handleNewValue({ value: getValueFromEvent(e), debounce: true })}
          on:change={(e) =>
            handleNewValue({ value: getValueFromEvent(e), debounce: false })}
        />
      </Debounce>
    </LabeledInput>
  </div>
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
