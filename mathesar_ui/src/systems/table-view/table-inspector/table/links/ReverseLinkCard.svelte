<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import FieldDelimiter from '@mathesar/components/FieldDelimiter.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { storeToGetTablePageUrl } from '@mathesar/stores/storeBasedUrls';

  import LinkCard from './LinkCard.svelte';

  export let referentTable: { name: string };
  export let referencingTable: Pick<Table, 'name' | 'oid'>;
  export let referencingColumn: { name: string };

  $: href = $storeToGetTablePageUrl({ tableId: referencingTable.oid });
</script>

{#if href}
  <LinkCard {href} displayAsMultiple>
    <TableName slot="table-name" table={referencingTable} truncate={false} />
    <svelte:fragment slot="detail">
      <RichText text={$_('reference_references_referent')} let:slotName>
        {#if slotName === 'reference'}
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
        {:else if slotName === 'referent'}
          <TableName table={referentTable} truncate={false} />
        {/if}
      </RichText>
    </svelte:fragment>
  </LinkCard>
{/if}
