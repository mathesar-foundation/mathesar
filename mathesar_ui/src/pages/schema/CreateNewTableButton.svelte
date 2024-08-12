<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import type { Schema } from '@mathesar/api/rpc/schemas';
  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import LinkMenuItem from '@mathesar/component-library/menu/LinkMenuItem.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/databases';
  import { getImportPageUrl, getTablePageUrl } from '@mathesar/routes/urls';
  import { createTable } from '@mathesar/stores/tables';
  import {
    ButtonMenuItem,
    DropdownMenu,
    Spinner,
  } from '@mathesar-component-library';

  export let database: Database;
  export let schema: Schema;

  let isCreatingNewTable = false;

  async function handleCreateEmptyTable() {
    isCreatingNewTable = true;
    const tableOid = await createTable(database, schema, {});
    isCreatingNewTable = false;
    router.goto(getTablePageUrl(database.id, schema.oid, tableOid), false);
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
  <LinkMenuItem href={getImportPageUrl(database.id, schema.oid)}>
    {$_('from_data_import')}
  </LinkMenuItem>
</DropdownMenu>
