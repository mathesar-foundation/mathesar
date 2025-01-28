<script lang="ts">
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { Select } from '@mathesar-component-library';

  import ProcessedColumnName from './column/ProcessedColumnName.svelte';

  export let columns: ProcessedColumn[];
  export let value: ProcessedColumn | undefined = undefined;
  export let disabled = false;
  export let onUpdate: ((v: ProcessedColumn | undefined) => void) | undefined =
    undefined;
  export let allowEmpty = false;
</script>

<Select
  options={[...(allowEmpty ? [undefined] : []), ...columns]}
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  bind:value
  {disabled}
  on:change={({ detail: column }) => onUpdate?.(column)}
  let:option
>
  {#if option}
    <ProcessedColumnName processedColumn={option} />
  {:else}
    <div class="empty"></div>
  {/if}
</Select>

<style>
  .empty {
    min-width: 3rem;
  }
</style>
