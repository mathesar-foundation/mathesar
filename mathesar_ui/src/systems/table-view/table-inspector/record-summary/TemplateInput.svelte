<script lang="ts">
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { FormattedInput } from '@mathesar/component-library';
  import TemplateInputFormatter from './TemplateInputFormatter';
  import AppendColumn from './AppendColumn.svelte';

  export let value: string | undefined = undefined;
  export let columns: Column[];

  $: formatter = new TemplateInputFormatter(columns);

  function insertColumn(column: Column) {
    value = `${value}{${column.id}}`;
  }
</script>

<FormattedInput {formatter} bind:value />
<span class="column-insert">
  <AppendColumn {columns} onSelect={insertColumn} />
</span>

<style>
  .column-insert {
    display: block;
    text-align: right;
  }
</style>
