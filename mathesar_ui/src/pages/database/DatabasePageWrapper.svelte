<script lang="ts">
  import { _ } from 'svelte-i18n';

  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import {
    iconDatabase,
    iconDeleteMajor,
    iconMoreActions,
  } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Database } from '@mathesar/models/Database';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getDatabasePageSchemasSectionUrl,
    getDatabasePageSettingsSectionUrl,
  } from '@mathesar/routes/urls';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    Button,
    ButtonMenuItem,
    DropdownMenu,
    TabContainer,
  } from '@mathesar-component-library';

  import DatabasePermissionsModal from './permissions/DatabasePermissionsModal.svelte';

  const permissionsModal = modal.spawnModalController();

  const userProfileStore = getUserProfileStoreFromContext();
  $: ({ isMathesarAdmin } = $userProfileStore);

  export let database: Database;

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
      icon: iconDatabase,
      description: `${$_(
        'db_server',
      )}: ${database.server.getConnectionString()}`,
    }}
  >
    <div slot="action">
      <Button appearance="secondary" on:click={() => permissionsModal.open()}>
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
          <ButtonMenuItem icon={iconDeleteMajor}>
            {$_('disconnect_database')}
          </ButtonMenuItem>
          <ButtonMenuItem icon={iconDeleteMajor} danger>
            {$_('delete_database')}
          </ButtonMenuItem>
        </DropdownMenu>
      {/if}
    </div>
  </AppSecondaryHeader>

  <TabContainer {activeTab} {tabs} uniformTabWidth={false}>
    <div class="tab-content">
      <slot {setSection} />
    </div>
  </TabContainer>
</LayoutWithHeader>

<DatabasePermissionsModal controller={permissionsModal} />

<style>
  .tab-content {
    padding: 1rem 0;
  }
</style>
