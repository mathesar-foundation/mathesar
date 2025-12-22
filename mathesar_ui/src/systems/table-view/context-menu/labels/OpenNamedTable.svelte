<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Table } from '@mathesar/models/Table';

  export let table: Table;
</script>

<RichText text={$_('open_named_table')} let:slotName>
  {#if slotName === 'tableName'}
    <TableName truncate={false} {table} />
  {/if}
</RichText>
