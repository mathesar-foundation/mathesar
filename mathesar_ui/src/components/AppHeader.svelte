<script lang="ts">
  import {
    DropdownMenu,
    Icon,
    iconLoading,
    LinkMenuItem,
    MenuHeading,
    MenuDivider,
  } from '@mathesar-component-library';
  import { currentDatabase } from '@mathesar/stores/databases';
  import {
    iconAddNew,
    iconExploration,
    iconShortcuts,
    iconUser,
    iconDatabase,
    iconLogout,
    iconSettingsMajor,
  } from '@mathesar/icons';
  import {
    getDatabasePageUrl,
    getDataExplorerPageUrl,
    getImportPageUrl,
    getTablePageUrl,
    USER_PROFILE_URL,
    LOGOUT_URL,
    ADMIN_URL,
  } from '@mathesar/routes/urls';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { createTable } from '@mathesar/stores/tables';
  import { router } from 'tinro';
  import ButtonMenuItem from '@mathesar/component-library/menu/ButtonMenuItem.svelte';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import Breadcrumb from './breadcrumb/Breadcrumb.svelte';

  const userProfile = getUserProfileStoreFromContext();

  $: database = $currentDatabase;
  $: schema = $currentSchemaId;
  $: allowTableCreation = (() => {
    if (database && schema) {
      return (
        $userProfile?.hasPermission(
          { database, schema: { id: schema } },
          'performCrud',
        ) ?? false
      );
    }
    return false;
  })();

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
        {#if allowTableCreation}
          <ButtonMenuItem icon={iconAddNew} on:click={handleCreateEmptyTable}>
            New Table from Scratch
          </ButtonMenuItem>
          <LinkMenuItem
            icon={iconAddNew}
            href={getImportPageUrl(database?.name, schema)}
          >
            New Table from Data Import
          </LinkMenuItem>
        {/if}
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
      menuStyle="--spacing-x: 0.3em;"
    >
      <div class="user-switcher" slot="trigger">
        <Icon {...iconSettingsMajor} />
      </div>
      {#if database}
        <MenuHeading>Database</MenuHeading>
        <LinkMenuItem
          icon={iconDatabase}
          href={getDatabasePageUrl(database.name)}
        >
          {database.name}
        </LinkMenuItem>
        <MenuDivider />
      {/if}
      <MenuHeading>Signed in as</MenuHeading>
      <LinkMenuItem icon={iconUser} href={USER_PROFILE_URL}>
        {$userProfile?.getDisplayName() ?? 'User profile'}
      </LinkMenuItem>
      <MenuDivider />
      {#if $userProfile?.is_superuser}
        <LinkMenuItem icon={iconSettingsMajor} href={ADMIN_URL}>
          Administration
        </LinkMenuItem>
      {/if}
      <LinkMenuItem icon={iconLogout} href={LOGOUT_URL} tinro-ignore>
        Log Out
      </LinkMenuItem>
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
