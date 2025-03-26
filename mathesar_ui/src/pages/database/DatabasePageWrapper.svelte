<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import { staticText } from '@mathesar/i18n/staticText';
  import {
    iconDatabase,
    iconDeleteMajor,
    iconEdit,
    iconMoreActions,
    iconPermissions,
    iconReinstall,
  } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Database } from '@mathesar/models/Database';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getDatabasePageSchemasSectionUrl,
    getDatabasePageSettingsSectionUrl,
  } from '@mathesar/routes/urls';
  import { databasesStore } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import EditDatabaseModal from '@mathesar/systems/databases/edit-database/EditDatabaseModal.svelte';
  import UpgradeDatabaseModal from '@mathesar/systems/databases/upgrade-database/UpgradeDatabaseModal.svelte';
  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import {
    Button,
    ButtonMenuItem,
    DropdownMenu,
    Help,
    Icon,
    TabContainer,
  } from '@mathesar-component-library';

  import DisconnectDatabaseModal from './disconnect/DisconnectDatabaseModal.svelte';
  import DatabasePermissionsModal from './permissions/DatabasePermissionsModal.svelte';

  const databaseRouteContext = DatabaseRouteContext.get();
  $: ({ database, underlyingDatabase } = $databaseRouteContext);
  $: void underlyingDatabase.runConservatively({ database_id: database.id });

  const commonData = preloadCommonData();

  $: currentRoleOwnsDatabase =
    $underlyingDatabase.resolvedValue?.currentAccess.currentRoleOwns;
  $: isDatabaseInInternalServer =
    database.server.host === commonData.internal_db.host &&
    database.server.port === commonData.internal_db.port;

  const permissionsModal = modal.spawnModalController();
  const disconnectModal = modal.spawnModalController<Database>();
  const reinstallModal = modal.spawnModalController<Database>();
  const editModal = modal.spawnModalController();

  const userProfileStore = getUserProfileStoreFromContext();
  $: ({ isMathesarAdmin } = $userProfileStore);

  type Section = 'schemas' | 'settings';
  let section: Section = 'schemas';

  $: tabs = [
    {
      id: 'schemas',
      label: $_('schemas'),
      href: getDatabasePageSchemasSectionUrl(database.id),
    },
    {
      id: 'settings',
      label: $_('database_settings'),
      href: getDatabasePageSettingsSectionUrl(database.id),
    },
  ];
  $: activeTab = tabs.find((tab) => tab.id === section);

  export function setSection(_section: Section) {
    section = _section;
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle(database.displayName)}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--page-padding': '0',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
    '--layout-background-color': 'var(--sand-50)',
  }}
>
  <AppSecondaryHeader
    slot="secondary-header"
    name={database.displayName}
    entityTypeName={$_('database')}
    icon={iconDatabase}
  >
    <div slot="subText" class="details">
      <div>
        <span class="label">{$_('db_server')}{staticText.COLON}</span>
        {database.server.getConnectionString()}
      </div>
      {#if database.name !== database.displayName}
        <div>
          <span class="label">{$_('db_name')}{staticText.COLON}</span>
          {database.name}
        </div>
      {/if}
      {#if isMathesarAdmin}
        <div class="edit-connection">
          <Button on:click={() => editModal.open()} appearance="link">
            <Icon {...iconEdit} />
            <span>{$_('edit_connection')}</span>
          </Button>
        </div>
      {/if}
    </div>
    <div slot="action">
      <div class="actions-container">
        <Button appearance="secondary" on:click={() => permissionsModal.open()}>
          <Icon {...iconPermissions} />
          <span>{$_('database_permissions')}</span>
        </Button>

        {#if isMathesarAdmin}
          <div class="dropdown-container">
            <DropdownMenu
              showArrow={false}
              triggerAppearance="secondary"
              closeOnInnerClick={false}
              icon={iconMoreActions}
              preferredPlacement="bottom-end"
            >
              <ButtonMenuItem
                icon={iconDeleteMajor}
                on:click={() => disconnectModal.open(database)}
              >
                {$_('disconnect_database')}
              </ButtonMenuItem>
              <ButtonMenuItem
                icon={iconReinstall}
                on:click={() => reinstallModal.open(database)}
              >
                {$_('reinstall_mathesar_schemas')}
              </ButtonMenuItem>
              <!--
                TODO: Allow dropping databases
                https://github.com/mathesar-foundation/mathesar/issues/3862
              -->
              <!-- {#if isDatabaseInInternalServer}
                <ButtonMenuItem
                  icon={iconDeleteMajor}
                  danger
                  disabled={!$currentRoleOwnsDatabase}
                >
                  {$_('delete_database')}
                </ButtonMenuItem>
              {/if} -->
            </DropdownMenu>
          </div>
        {/if}
      </div>
    </div>
  </AppSecondaryHeader>

  <TabContainer {activeTab} {tabs} uniformTabWidth={false}>
    <div class="tab-container">
      <slot {setSection} />
    </div>
    <div slot="tab" let:tab>
      <!--
        From Sean: I wrote this `{#if}` block because I needed to customize the
        tab label using rich text, but I don't like the approach here.

        I'd rather do something like pass a property from `tab` into our
        `<Render>` component. But to do that we'd need to make the
        `<TabContainer>` component generic over `Tab` or use a type assertion.
        I'd argue that `TabContainer` should be generic anyway. But I don't want
        to refactor that right now. And type assertions are tricky to put into
        the Svelte template area. So I'm leaving this for now.
       -->
      {#if tab.id === 'schemas'}
        {tab.label}
        <Help placements={['top-start', 'bottom-start']}>
          <p>{$_('schemas_list_help')}</p>
          <p><SeeDocsToLearnMore page="schemas" /></p>
        </Help>
      {:else}
        {tab.label}
      {/if}
    </div>
  </TabContainer>
</LayoutWithHeader>

<EditDatabaseModal controller={editModal} {database} />
<DatabasePermissionsModal controller={permissionsModal} />
<UpgradeDatabaseModal controller={reinstallModal} isReinstall />
<DisconnectDatabaseModal
  controller={disconnectModal}
  disconnect={async (opts) => {
    await databasesStore.disconnectDatabase(opts);
    router.goto('/');
  }}
/>

<style>
  .tab-container {
    padding: var(--size-xx-large) 0;
  }
  .details {
    font-size: var(--text-size-base);
    color: var(--stormy-500);
    margin-top: var(--size-super-ultra-small);
  }
  .details .label {
    color: var(--stormy-600);
  }
  .edit-connection {
    margin-top: var(--size-small);
    display: inline-flex;
  }
  .actions-container {
    display: flex;
    align-items: center;
    gap: var(--size-x-large);
  }
  .dropdown-container {
    margin-left: auto;
  }
</style>
