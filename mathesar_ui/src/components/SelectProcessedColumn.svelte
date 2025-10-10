<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { Select } from '@mathesar-component-library';

  import ProcessedColumnName from './column/ProcessedColumnName.svelte';

  interface $$Props
    extends Omit<
      ComponentProps<Select<ProcessedColumn>>,
      'value' | 'options' | 'labelKey' | 'valuesAreEqual'
    > {
    value?: ProcessedColumn;
    columns: ProcessedColumn[];
    allowEmpty?: boolean;
    onUpdate?: (v: ProcessedColumn | undefined) => void;
  }

  export let columns: ProcessedColumn[];
  export let value: ProcessedColumn | undefined = undefined;
  export let onUpdate: ((v: ProcessedColumn | undefined) => void) | undefined =
    undefined;
  export let allowEmpty = false;
</script>

<Select
  options={[...(allowEmpty ? [undefined] : []), ...columns]}
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  bind:value
  {...$$restProps}
  on:change={({ detail: column }) => onUpdate?.(column)}
  let:option
>
  {#if option}
    <ProcessedColumnName processedColumn={option} />
  {:else}
    <div class="empty">
      <slot name="empty" />
    </div>
  {/if}
</Select>

<style>
  .empty {
    min-width: 3rem;
  }
</style>
