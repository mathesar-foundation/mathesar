<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { Column } from '@mathesar/api/rpc/columns';
  import { FormattedInput } from '@mathesar-component-library';

  import AppendColumn from './AppendColumn.svelte';
  import TemplateInputFormatter from './TemplateInputFormatter';

  interface $$Props
    extends Omit<ComponentProps<FormattedInput<string>>, 'formatter'> {
    columns: Column[];
  }

  export let value: string | null | undefined = undefined;
  export let columns: Column[];
  export let disabled = false;

  $: formatter = new TemplateInputFormatter(columns);

  function insertColumn(column: Column) {
    value = `${value}{${column.id}}`;
  }
</script>

<FormattedInput {formatter} bind:value {disabled} {...$$restProps} />
<span class="column-insert">
  <AppendColumn {columns} onSelect={insertColumn} {disabled} />
</span>

<style>
  .column-insert {
    display: block;
    text-align: right;
    margin-top: 0.5rem;
  }
</style>
