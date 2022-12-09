<script lang="ts">
  import {
    DropdownMenu,
    Icon,
    iconLoading,
    LinkMenuItem,
    MenuHeading,
  } from '@mathesar-component-library';
  import { currentDatabase } from '@mathesar/stores/databases';
  import {
    iconAddNew,
    iconExploration,
    iconShortcuts,
    iconUser,
  } from '@mathesar/icons';
  import {
    getDatabasePageUrl,
    getDataExplorerPageUrl,
    getImportPageUrl,
    getTablePageUrl,
  } from '@mathesar/routes/urls';
  import DatabaseName from '@mathesar/components/DatabaseName.svelte';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { createTable } from '@mathesar/stores/tables';
  import { router } from 'tinro';
  import ButtonMenuItem from '@mathesar/component-library/menu/ButtonMenuItem.svelte';
  import Breadcrumb from './breadcrumb/Breadcrumb.svelte';

  $: database = $currentDatabase;
  $: schema = $currentSchemaId;

  let isCreatingNewEmptyTable = false;

  async function handleCreateEmptyTable() {
    if (!schema || !database) {
      return;
    }
    isCreatingNewEmptyTable = true;
    const tableInfo = await createTable(schema, {});
    isCreatingNewEmptyTable = false;
    router.goto(getTablePageUrl(database.name, schema, tableInfo.id), false);
  }
</script>

<header class="app-header">
  <div class="left">
    <Breadcrumb />
  </div>

  <div class="right">
    {#if schema && database}
      <DropdownMenu
        triggerAppearance="ghost"
        size="small"
        closeOnInnerClick={true}
        icon={isCreatingNewEmptyTable ? iconLoading : undefined}
      >
        <span slot="trigger" class="shortcuts">
          <span class="icon"><Icon {...iconShortcuts} /></span>
          <span class="text">Shortcuts</span>
        </span>
        <ButtonMenuItem icon={iconAddNew} on:click={handleCreateEmptyTable}>
          New Table from Scratch
        </ButtonMenuItem>
        <LinkMenuItem
          icon={iconAddNew}
          href={getImportPageUrl(database?.name, schema)}
        >
          New Table from Data Import
        </LinkMenuItem>
        <LinkMenuItem
          icon={iconExploration}
          href={getDataExplorerPageUrl(database?.name, schema)}
        >
          Open Data Explorer
        </LinkMenuItem>
      </DropdownMenu>
    {/if}
    <DropdownMenu
      triggerAppearance="ghost"
      size="small"
      closeOnInnerClick={true}
      label=""
      icon={iconUser}
    >
      <div class="user-switcher" slot="trigger">
        <Icon {...iconUser} />
      </div>
      {#if database}
        <MenuHeading>Database</MenuHeading>
        <LinkMenuItem href={getDatabasePageUrl(database.name)}>
          <DatabaseName {database} />
        </LinkMenuItem>
      {/if}
    </DropdownMenu>
  </div>
</header>

<style lang="scss">
  .app-header {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 1rem;
    height: var(--header-height, 60px);
    background-color: var(--slate-800);
    overflow: hidden;
    color: var(--white);
  }

  .left {
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .right {
    display: flex;
    align-items: center;
    font-size: var(--text-size-large);
  }

  .shortcuts .text {
    display: none;
  }
  .shortcuts .icon,
  .user-switcher {
    background-color: var(--slate-200);
    color: var(--slate-800);
    border-radius: var(--border-radius-m);
    padding: 0.5rem;
    display: flex;
    align-items: center;
  }

  @media (min-width: 45rem) {
    .shortcuts .text {
      display: unset;
    }
    .shortcuts .icon {
      display: none;
    }
  }
</style>
