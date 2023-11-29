<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { Database } from '@mathesar/AppTypes';
  import { iconDatabase, iconConnection } from '@mathesar/icons';
  import { getDatabasePageUrl, CONNECTIONS_URL } from '@mathesar/routes/urls';
  import {
    currentDBName,
    databases as dbStore,
  } from '@mathesar/stores/databases';
  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  function makeBreadcrumbSelectorItem(
    dbEntry: Database,
  ): BreadcrumbSelectorEntry {
    return {
      type: 'simple',
      label: dbEntry.nickname,
      href: getDatabasePageUrl(dbEntry.nickname),
      icon: iconDatabase,
      isActive() {
        return dbEntry.nickname === $currentDBName;
      },
    };
  }

  $: databases = [...$dbStore.data.values()];
</script>

<BreadcrumbSelector
  data={new Map([['Databases', databases.map(makeBreadcrumbSelectorItem)]])}
  triggerLabel="Choose a Database"
  persistentLinks={[
    {
      type: 'simple',
      label: $_('manage_connections'),
      href: CONNECTIONS_URL,
      icon: iconConnection,
      // TODO: Handle active states for persistent links
      isActive: () => false,
    },
  ]}
/>
