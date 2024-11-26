<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { JoinableTablesResult } from '@mathesar/api/rpc/tables';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    iconAddNew,
    iconLinksFromOtherTables,
    iconLinksInThisTable,
  } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import { modal } from '@mathesar/stores/modal';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import LinkTableModal from '@mathesar/systems/table-view/link-table/LinkTableModal.svelte';
  import { Button, Help, Icon } from '@mathesar-component-library';

  import ForwardLinkCard from './ForwardLinkCard.svelte';
  import ReverseLinkCard from './ReverseLinkCard.svelte';
  import { getLinksInThisTable, getLinksToThisTable } from './utils';

  const linkTableModal = modal.spawnModalController();

  export let table: Pick<Table, 'name' | 'oid'>;
  export let joinableTablesResult: JoinableTablesResult;
  export let currentTableColumns: Map<number, ProcessedColumn>;

  $: linksInThisTable = [
    ...getLinksInThisTable(joinableTablesResult, currentTableColumns),
  ];
  $: linksFromOtherTables = [...getLinksToThisTable(joinableTablesResult)];
  $: showNullState = !linksInThisTable.length && !linksFromOtherTables.length;
</script>

<div class="links-content">
  {#if linksInThisTable.length}
    <div>
      <div class="header">
        <Icon {...iconLinksInThisTable} />
        <span>{$_('in_this_table')}</span>
        <Help>
          <RichText
            text={$_('table_can_have_one')}
            let:slotName
            let:translatedArg
          >
            {#if slotName === 'tableName'}
              <TableName {table} truncate={false} />
            {:else if slotName === 'bold'}
              <strong>{translatedArg}</strong>
            {/if}
          </RichText>
        </Help>
      </div>
      <div class="links">
        {#each linksInThisTable as link}
          <ForwardLinkCard
            referentTable={link.table}
            referencingTable={table}
            referencingColumn={link.column}
          />
        {/each}
      </div>
    </div>
  {/if}

  {#if linksFromOtherTables.length}
    <div>
      <div class="header">
        <Icon {...iconLinksFromOtherTables} />
        <span>{$_('to_this_table')}</span>
        <Help>
          <RichText
            text={$_('table_can_have_many')}
            let:slotName
            let:translatedArg
          >
            {#if slotName === 'tableName'}
              <TableName {table} truncate={false} />
            {:else if slotName === 'bold'}
              <strong>{translatedArg}</strong>
            {/if}
          </RichText>
        </Help>
      </div>

      <div class="links">
        {#each linksFromOtherTables as link}
          <ReverseLinkCard
            referencingTable={link.table}
            referencingColumn={link.column}
            referentTable={table}
          />
        {/each}
      </div>
    </div>
  {/if}

  {#if showNullState}
    <span class="null-text">{$_('table_does_not_link')}</span>
  {/if}

  <div>
    <Button
      on:click={() => linkTableModal.open()}
      appearance="secondary"
      size="small"
    >
      <Icon {...iconAddNew} />
      <span>{$_('create_reference')}</span>
    </Button>
    <LinkTableModal controller={linkTableModal} />
  </div>
</div>

<style>
  .links-content > :global(* + *) {
    margin-top: 1rem;
  }
  .null-text {
    color: var(--color-text-muted);
  }
  .header {
    margin-bottom: 0.5rem;
    font-weight: var(--font-weight-medium);
  }
  .links > :global(* + *) {
    margin-top: 0.7rem;
  }
</style>
