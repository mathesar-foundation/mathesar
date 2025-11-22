<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { Button, Icon, Select, iconClose } from '@mathesar-component-library';

  import type { QuerySummarizationAggregationEntry } from '../../../QuerySummarizationTransformationModel';
  import type { ProcessedQueryResultColumn } from '../../../utils';

  const dispatch = createEventDispatcher();

  export let processedColumn: ProcessedQueryResultColumn | undefined;
  export let aggregation: QuerySummarizationAggregationEntry;
  export let limitEditing = false;

  $: functions = processedColumn?.summarizationFunctions ?? [];
  $: functionIds = functions.map((f) => f.id);
</script>

<div class="aggregation">
  <RichText text={$_('aggregate_column_as_function')} let:slotName>
    {#if slotName === 'column'}
      {#if processedColumn}
        <ColumnName
          column={{
            ...processedColumn.column,
            name:
              processedColumn.column.display_name ??
              processedColumn.column.alias,
          }}
        />
      {:else}
        <div>{aggregation.inputAlias}</div>
      {/if}
    {:else if slotName === 'function'}
      <Select
        options={functionIds}
        bind:value={aggregation.function}
        disabled={limitEditing}
        getLabel={(id) => functions.find((f) => f.id === id)?.label ?? ''}
        on:change={() => dispatch('update')}
      />
    {/if}
  </RichText>

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
  }
</style>
