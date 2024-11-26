<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import FieldDelimiter from '@mathesar/components/FieldDelimiter.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { storeToGetTablePageUrl } from '@mathesar/stores/storeBasedUrls';


  import LinkCard from './LinkCard.svelte';

  export let referentTable: Pick<Table, 'name' | 'oid'>;
  export let referencingTable: { name: string };
  export let referencingColumn: { name: string };

  $: href = $storeToGetTablePageUrl({ tableId: referentTable.oid });
</script>

{#if href}
  <LinkCard {href}>
    <TableName slot="table-name" table={referentTable} truncate={false} />
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
            }}
            truncate={false}
          />
        {/if}
      </RichText>
    </svelte:fragment>
  </LinkCard>
{/if}
