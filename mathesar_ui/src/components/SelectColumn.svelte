<script lang="ts">
  import type { Column } from '@mathesar/api/rpc/columns';
  import { Select } from '@mathesar-component-library';

  import ColumnName from './column/ColumnName.svelte';

  export let columns: Column[];
  export let value: Column | undefined = undefined;
  export let onUpdate: ((v: Column | undefined) => void) | undefined =
    undefined;
</script>

<Select
  options={columns}
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  bind:value
  on:change={({ detail: column }) => onUpdate?.(column)}
  let:option
>
  {#if option}
    <ColumnName column={option} />
  {:else}
    <div class="empty"></div>
  {/if}
</Select>

<style>
  .empty {
    min-width: 3rem;
  }
</style>
