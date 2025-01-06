<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import PhraseContainingIdentifier from '@mathesar/components/PhraseContainingIdentifier.svelte';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import {
    iconDatabase,
    iconDeleteMajor,
    iconMoreActions,
    iconPermissions,
  } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getDatabasePageSchemasSectionUrl,
    getDatabasePageSettingsSectionUrl,
  } from '@mathesar/routes/urls';
  import { confirm } from '@mathesar/stores/confirmation';
  import { databasesStore } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import {
    Button,
    ButtonMenuItem,
    DropdownMenu,
    Icon,
    TabContainer,
  } from '@mathesar-component-library';

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
      label: $_('settings'),
      href: getDatabasePageSettingsSectionUrl(database.id),
    },
  ];
  $: activeTab = tabs.find((tab) => tab.id === section);

  export function setSection(_section: Section) {
    section = _section;
  }

  async function disconnectDatabase() {
    await confirm({
      title: {
        component: PhraseContainingIdentifier,
        props: {
          identifier: database.name,
          wrappingString: $_('disconnect_database_with_name'),
        },
      },
      body: [
        $_('action_cannot_be_undone'),
        $_('disconnect_database_info'),
        $_('disconnect_database_db_delete_info'),
        $_('are_you_sure_to_proceed'),
      ],
      proceedButton: {
        label: $_('disconnect_database'),
        icon: undefined,
      },
      onProceed: async () => {
        await databasesStore.disconnectDatabase(database);
      },
      onSuccess: () => {
        toast.success($_('database_disconnect_success'));
        router.goto('/');
      },
      onError: (e) =>
        toast.error({
          message: `${$_('database_disconnect_failed')} ${e.message}`,
        }),
    });
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle(database.name)}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
    '--layout-background-color': 'var(--sand-50)',
  }}
>
  <AppSecondaryHeader
    slot="secondary-header"
    pageTitleAndMetaProps={{
      name: database.name,
      entityTypeName: $_('database'),
      icon: iconDatabase,
      subText: `${$_('db_server')}: ${database.server.getConnectionString()}`,
    }}
  >
    <div slot="action">
      <Button appearance="secondary" on:click={() => permissionsModal.open()}>
        <Icon {...iconPermissions} />
        <span>{$_('database_permissions')}</span>
      </Button>

      {#if isMathesarAdmin}
        <DropdownMenu
          showArrow={false}
          triggerAppearance="plain"
          closeOnInnerClick={false}
          icon={iconMoreActions}
          preferredPlacement="bottom-end"
        >
          <ButtonMenuItem icon={iconDeleteMajor} on:click={disconnectDatabase}>
            {$_('disconnect_database')}
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
      {/if}
    </div>
  </AppSecondaryHeader>

  <TabContainer {activeTab} {tabs} uniformTabWidth={false}>
    <div class="tab-container">
      <slot {setSection} />
    </div>
  </TabContainer>
</LayoutWithHeader>

<DatabasePermissionsModal controller={permissionsModal} />

<style>
  .tab-container {
    padding: var(--size-xx-large) 0;
  }
</style>
