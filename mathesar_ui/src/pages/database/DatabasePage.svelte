<script lang="ts">
  import { _ } from 'svelte-i18n';

  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import {
    iconDatabase,
    iconDeleteMajor,
    iconMoreActions,
  } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Database } from '@mathesar/models/databases';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getDatabasePageSchemasSectionUrl,
    getDatabasePageSettingsSectionUrl,
  } from '@mathesar/routes/urls';
  import {
    Button,
    ButtonMenuItem,
    DropdownMenu,
    TabContainer,
  } from '@mathesar-component-library';

  import SchemasSection from './SchemasSection.svelte';
  import SettingsSection from './SettingsSection.svelte';

  export let database: Database;
  export let section: string;

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
  $: activeTab = tabs.find((tab) => tab.id === section) ?? tabs[0];

  function openPermissionsModal() {
    //
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle(database.name)}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
  }}
>
  <AppSecondaryHeader
    slot="secondary-header"
    pageTitleAndMetaProps={{
      name: database.name,
      icon: iconDatabase,
      description: `DB server: ${database.server.host}:${database.server.port}`,
    }}
  >
    <div slot="action">
      <Button on:click={openPermissionsModal} appearance="secondary">
        <span>{$_('database_permissions')}</span>
      </Button>

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
    </div>
  </AppSecondaryHeader>

  <TabContainer {activeTab} {tabs} uniformTabWidth={false}>
    {#if activeTab?.id === 'schemas'}
      <SchemasSection {database} />
    {:else if activeTab?.id === 'settings'}
      <SettingsSection />
    {/if}
  </TabContainer>
</LayoutWithHeader>
