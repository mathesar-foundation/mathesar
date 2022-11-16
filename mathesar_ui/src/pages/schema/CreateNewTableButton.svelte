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

  export let database: Database;
  export let schema: SchemaEntry;

  let isCreatingNewTable = false;

  async function handleCreateEmptyTable() {
    isCreatingNewTable = true;
    const tableInfo = await createTable(schema.id, {});
    isCreatingNewTable = false;
    router.goto(getTablePageUrl(database.name, schema.id, tableInfo.id), false);
  }
</script>

<DropdownMenu
  showArrow={true}
  triggerAppearance="plain-primary"
  closeOnInnerClick={true}
  label="New Table"
>
  <div slot="trigger">
    {#if isCreatingNewTable}
      <Spinner />
    {:else}
      <Icon {...iconAddNew} />
    {/if}
    <span>New Table</span>
  </div>
  <ButtonMenuItem on:click={handleCreateEmptyTable}>From Scratch</ButtonMenuItem
  >
  <LinkMenuItem href={getImportPageUrl(database.name, schema.id)}>
    From Data Import
  </LinkMenuItem>
</DropdownMenu>
