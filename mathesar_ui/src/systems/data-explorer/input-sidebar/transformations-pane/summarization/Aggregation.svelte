<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Select, Icon, Button, iconClose } from '@mathesar-component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import type { QuerySummarizationAggregationEntry } from '../../../QuerySummarizationTransformationModel';
  import type { ProcessedQueryResultColumn } from '../../../utils';

  const dispatch = createEventDispatcher();

  export let processedColumn: ProcessedQueryResultColumn | undefined;
  export let aggregation: QuerySummarizationAggregationEntry;
  export let limitEditing = false;

  function getAggregationsBasedOnColumnType() {
    const availableAggregation: (
      | 'distinct_aggregate_to_array'
      | 'count'
      | 'sum'
    )[] = ['distinct_aggregate_to_array', 'count'];
    if (processedColumn?.column.type === 'numeric') {
      availableAggregation.push('sum');
    }
    return availableAggregation;
  }

  function getAggregationTypeLabel(aggType?: string) {
    switch (aggType) {
      case 'distinct_aggregate_to_array':
        return 'List';
      case 'count':
        return 'Count';
      case 'sum':
        return 'Sum';
      default:
        return '';
    }
  }
</script>

<div class="aggregation">
  {#if processedColumn}
    <ColumnName
      column={{
        ...processedColumn.column,
        name:
          processedColumn.column.display_name ?? processedColumn.column.alias,
      }}
    />
  {:else}
    <div>{aggregation.inputAlias}</div>
  {/if}
  <span>as</span>
  <Select
    options={getAggregationsBasedOnColumnType()}
    bind:value={aggregation.function}
    disabled={limitEditing}
    getLabel={getAggregationTypeLabel}
    on:change={() => dispatch('update')}
  />
  <Button
    disabled={limitEditing}
    appearance="plain"
    on:click={() => dispatch('remove')}
  >
    <Icon {...iconClose} size="0.8rem" />
  </Button>
</div>

<style lang="scss">
  .aggregation {
    margin: 0.8rem 0 0 0.3rem;
    display: grid;
    grid-template-columns: 7fr 1fr 3fr 0.5fr;
    align-items: center;

    span {
      padding: 0.3rem;
      text-align: center;
    }
  }
</style>
