<script lang="ts">
  import { router } from 'tinro';
  import { createTable } from '@mathesar/stores/tables';
  import { getImportPageUrl, getTablePageUrl } from '@mathesar/routes/urls';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import {
    DropdownMenu,
    Spinner,
    ButtonMenuItem,
  } from '@mathesar-component-library';
  import { iconAddNew } from '@mathesar/icons';
  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import LinkMenuItem from '@mathesar/component-library/menu/LinkMenuItem.svelte';
  import { LL } from '@mathesar/i18n/i18n-svelte';

  export let database: Database;
  export let schema: SchemaEntry;

  let isCreatingNewTable = false;

  async function handleCreateEmptyTable() {
    isCreatingNewTable = true;
    const tableInfo = await createTable(database, schema, {});
    isCreatingNewTable = false;
    router.goto(getTablePageUrl(database.name, schema.id, tableInfo.id), false);
  }
</script>

<DropdownMenu
  showArrow={true}
  triggerAppearance="primary"
  closeOnInnerClick={true}
  label={$LL.general.newTable()}
>
  <div slot="trigger">
    {#if isCreatingNewTable}
      <Spinner />
    {:else}
      <Icon {...iconAddNew} />
    {/if}
    <span>{$LL.general.newTable()}</span>
  </div>
  <ButtonMenuItem on:click={handleCreateEmptyTable}>
    {$LL.general.fromScratch()}
  </ButtonMenuItem>
  <LinkMenuItem href={getImportPageUrl(database.name, schema.id)}>
    {$LL.createNewTableButton.fromDataImport()}
  </LinkMenuItem>
</DropdownMenu>
