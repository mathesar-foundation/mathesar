<script lang="ts">
  import { router } from 'tinro';
  import { _ } from 'svelte-i18n';
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
    const tableInfo = await createTable(database, schema, {});
    isCreatingNewTable = false;
    router.goto(getTablePageUrl(database.id, schema.id, tableInfo.id), false);
  }
</script>

<DropdownMenu
  showArrow={true}
  triggerAppearance="primary"
  closeOnInnerClick={true}
  label={$_('new_table')}
>
  <div slot="trigger">
    {#if isCreatingNewTable}
      <Spinner />
    {:else}
      <Icon {...iconAddNew} />
    {/if}
    <span>{$_('new_table')}</span>
  </div>
  <ButtonMenuItem on:click={handleCreateEmptyTable}>
    {$_('from_scratch')}
  </ButtonMenuItem>
  <LinkMenuItem href={getImportPageUrl(database.id, schema.id)}>
    {$_('from_data_import')}
  </LinkMenuItem>
</DropdownMenu>
