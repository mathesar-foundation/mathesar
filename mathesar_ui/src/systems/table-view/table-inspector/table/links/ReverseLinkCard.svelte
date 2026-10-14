<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import FieldDelimiter from '@mathesar/components/FieldDelimiter.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { getTablePageUrlByTable } from '@mathesar/routes/urls';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import { databasesStore } from '@mathesar/stores/databases';
  import { getTableFromStoreOrApi } from '@mathesar/stores/tables';

  import LinkCard from './LinkCard.svelte';

  const tableFetch = new AsyncStore(getTableFromStoreOrApi);

  export let referentTable: { name: string };
  export let referencingTable: Pick<Table, 'name' | 'oid'>;
  export let referencingColumn: { name: string };

  $: database = databasesStore.currentDatabase;
  $: $database
    ? void tableFetch.run({
        database: $database,
        tableOid: referencingTable.oid,
      })
    : tableFetch.reset();
  $: referencingTableModel = $tableFetch.resolvedValue;

  $: href = referencingTableModel
    ? getTablePageUrlByTable(referencingTableModel)
    : undefined;
</script>

{#if href && referencingTableModel}
  <LinkCard {href} displayAsMultiple>
    <TableName
      slot="table-name"
      table={referencingTableModel}
      truncate={false}
    />
    <svelte:fragment slot="detail">
      <RichText text={$_('reference_references_referent')} let:slotName>
        {#if slotName === 'reference'}
          <FieldDelimiter />
          <ColumnName
            column={{
              name: referencingColumn.name,
              type: '',
              type_options: null,
              metadata: null,
              constraintsType: ['foreignkey'],
            }}
            truncate={false}
          />
        {:else if slotName === 'referent'}
          <TableName table={referentTable} truncate={false} />
        {/if}
      </RichText>
    </svelte:fragment>
  </LinkCard>
{/if}
