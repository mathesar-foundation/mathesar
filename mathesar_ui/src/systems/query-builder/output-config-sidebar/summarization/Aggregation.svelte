<script lang="ts">
  import {
    Select,
    TextInput,
    LabeledInput,
    Checkbox,
  } from '@mathesar-component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import type { QuerySummarizationAggregationEntry } from '../../QuerySummarizationTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../../utils';

  export let columns: ProcessedQueryResultColumnMap;
  export let aggregation: QuerySummarizationAggregationEntry;

  $: columnDetails = columns.get(aggregation.inputAlias)?.column;

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
  {#if columnDetails}
    <header>
      <LabeledInput layout="inline-input-first">
        <Checkbox />
        <ColumnName
          slot="label"
          column={{
            ...columnDetails,
            name: columnDetails.display_name ?? columnDetails.alias,
          }}
        />
      </LabeledInput>
    </header>
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
  {:else}
    Error: Unknown column
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
