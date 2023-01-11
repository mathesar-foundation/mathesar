<script lang="ts">
  import { ButtonMenuItem, Truncate } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LinkMenuItem from '@mathesar/component-library/menu/LinkMenuItem.svelte';
  import HyperlinkCard from '@mathesar/components/HyperlinkCard.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconExploration,
    iconSelectRecord,
  } from '@mathesar/icons';
  import {
    getImportPreviewPageUrl,
    getTablePageUrl,
  } from '@mathesar/routes/urls';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import { deleteTable, refetchTablesForSchema } from '@mathesar/stores/tables';
  import { createDataExplorerUrlToExploreATable } from '@mathesar/systems/data-explorer';
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';
  import EditTable from './EditTable.svelte';

  const recordSelector = getRecordSelectorFromContext();
  const editTableModalController = modal.spawnModalController();

  export let table: TableEntry;
  export let database: Database;
  export let schema: SchemaEntry;

  $: isTableImportConfirmationNeeded = isTableImportConfirmationRequired(table);
  $: tablePageUrl = isTableImportConfirmationNeeded
    ? getImportPreviewPageUrl(database.name, schema.id, table.id)
    : getTablePageUrl(database.name, schema.id, table.id);
  $: explorationPageUrl = createDataExplorerUrlToExploreATable(
    database.name,
    schema.id,
    table,
  );
  $: description = table.description ?? '';

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: 'Table',
      onProceed: async () => {
        await deleteTable(table.id);
        await refetchTablesForSchema(schema.id);
      },
    });
  }

  function handleEditTable() {
    editTableModalController.open();
  }

  function handleFindRecord() {
    recordSelector.navigateToRecordPage({ tableId: table.id });
  }
</script>

<HyperlinkCard href={tablePageUrl} ariaLabel={table.name}>
  <svelte:fragment slot="top"><TableName {table} /></svelte:fragment>
  <svelte:fragment slot="menu">
    {#if !isTableImportConfirmationNeeded}
      <ButtonMenuItem on:click={handleFindRecord} icon={iconSelectRecord}>
        Find a Record
      </ButtonMenuItem>
      <ButtonMenuItem on:click={handleEditTable} icon={iconEdit}>
        Edit Table
      </ButtonMenuItem>
      <LinkMenuItem href={explorationPageUrl} icon={iconExploration}>
        Explore Table
      </LinkMenuItem>
    {/if}
    <ButtonMenuItem on:click={handleDeleteTable} danger icon={iconDeleteMajor}>
      Delete Table
    </ButtonMenuItem>
  </svelte:fragment>
  <svelte:fragment slot="bottom">
    {#if description}
      <Truncate lines={2}>{description}</Truncate>
    {/if}
  </svelte:fragment>
</HyperlinkCard>

<EditTable modalController={editTableModalController} {table} />
