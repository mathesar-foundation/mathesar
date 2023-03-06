<script lang="ts">
  import { router } from 'tinro';

  import {
    DropdownMenu,
    Icon,
    iconLoading,
    LinkMenuItem,
    MenuDivider,
    MenuHeading,
  } from '@mathesar-component-library';
  import ButtonMenuItem from '@mathesar/component-library/menu/ButtonMenuItem.svelte';
  import {
    iconAddNew,
    iconDatabase,
    iconExploration,
    iconLogout,
    iconSettingsMajor,
    iconShortcuts,
    iconUser,
  } from '@mathesar/icons';
  import {
    ADMIN_URL,
    getDatabasePageUrl,
    getDataExplorerPageUrl,
    getImportPageUrl,
    getTablePageUrl,
    LOGOUT_URL,
    USER_PROFILE_URL,
  } from '@mathesar/routes/urls';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { getReleaseDataStoreFromContext } from '@mathesar/stores/releases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { createTable } from '@mathesar/stores/tables';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import Breadcrumb from './breadcrumb/Breadcrumb.svelte';

  const userProfile = getUserProfileStoreFromContext();
  const releaseDataStore = getReleaseDataStoreFromContext();

  $: database = $currentDatabase;
  $: schema = $currentSchema;
  $: canExecuteDDL = $userProfile?.hasPermission(
    { database, schema },
    'canExecuteDDL',
  );
  $: upgradable = $releaseDataStore?.value?.upgradeStatus === 'upgradable';

  let isCreatingNewEmptyTable = false;

  async function handleCreateEmptyTable() {
    if (!schema || !database) {
      return;
    }
    isCreatingNewEmptyTable = true;
    const tableInfo = await createTable(schema.id, {});
    isCreatingNewEmptyTable = false;
    router.goto(getTablePageUrl(database.name, schema.id, tableInfo.id), false);
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
        {#if canExecuteDDL}
          <ButtonMenuItem icon={iconAddNew} on:click={handleCreateEmptyTable}>
            New Table from Scratch
          </ButtonMenuItem>
          <LinkMenuItem
            icon={iconAddNew}
            href={getImportPageUrl(database.name, schema.id)}
          >
            New Table from Data Import
          </LinkMenuItem>
        {/if}
        <LinkMenuItem
          icon={iconExploration}
          href={getDataExplorerPageUrl(database.name, schema.id)}
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
        <Icon {...iconSettingsMajor} hasNotificationDot={upgradable} />
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
      {#if $userProfile?.isSuperUser}
        <LinkMenuItem
          icon={iconSettingsMajor}
          href={ADMIN_URL}
          hasNotificationDot={upgradable}
        >
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
