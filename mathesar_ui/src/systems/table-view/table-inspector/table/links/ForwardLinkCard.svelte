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

  export let referentTable: Pick<Table, 'name' | 'oid'>;
  export let referencingTable: { name: string };
  export let referencingColumn: { name: string };

  $: database = databasesStore.currentDatabase;
  $: $database
    ? void tableFetch.run({ database: $database, tableOid: referentTable.oid })
    : tableFetch.reset();
  $: referentTableModel = $tableFetch.resolvedValue;

  $: href = referentTableModel
    ? getTablePageUrlByTable(referentTableModel)
    : undefined;
</script>

{#if referentTableModel && href}
  <LinkCard {href}>
    <TableName slot="table-name" table={referentTableModel} truncate={false} />
    <svelte:fragment slot="detail">
      <RichText text={$_('referenced_via_reference')} let:slotName>
        {#if slotName === 'reference'}
          <TableName table={referencingTable} truncate={false} />
          <FieldDelimiter />
          <ColumnName
            column={{
              name: referencingColumn.name,
              type: '',
              type_options: null,
              constraintsType: ['foreignkey'],
              metadata: null,
            }}
            truncate={false}
          />
        {/if}
      </RichText>
    </svelte:fragment>
  </LinkCard>
{/if}
