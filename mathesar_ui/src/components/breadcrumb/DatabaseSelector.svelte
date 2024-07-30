<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database } from '@mathesar/api/rpc/databases';
  import { iconConnectDatabase, iconDatabase } from '@mathesar/icons';
  import { HOME_URL, getDatabasePageUrl } from '@mathesar/routes/urls';
  import { databasesStore } from '@mathesar/stores/databases';

  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  const { databases, currentDatabaseId } = databasesStore;

  function makeBreadcrumbSelectorEntry(
    database: Database,
  ): BreadcrumbSelectorEntry {
    return {
      type: 'simple',
      label: database.name,
      href: getDatabasePageUrl(database.id),
      icon: iconDatabase,
      isActive: () => database.id === $currentDatabaseId,
    };
  }

  $: breadcrumbEntries = [...$databases.values()].map(
    makeBreadcrumbSelectorEntry,
  );
</script>

<BreadcrumbSelector
  data={new Map([[$_('databases'), breadcrumbEntries]])}
  triggerLabel={$_('choose_database')}
  persistentLinks={[
    {
      type: 'simple',
      label: $_('manage_databases'),
      href: HOME_URL,
      icon: {
        ...iconConnectDatabase,
        size: '1.4rem',
      },
      // TODO: Handle active states for persistent links
      isActive: () => false,
    },
  ]}
/>
