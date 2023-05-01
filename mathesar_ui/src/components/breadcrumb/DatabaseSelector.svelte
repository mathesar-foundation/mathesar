<script lang="ts">
  import type { Database } from '@mathesar/AppTypes';
  import { iconDatabase } from '@mathesar/icons';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
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
      label: dbEntry.name,
      href: getDatabasePageUrl(dbEntry.name),
      icon: iconDatabase,
      isActive() {
        return dbEntry.name === $currentDBName;
      },
    };
  }

  $: databases = [...$dbStore.data.values()];
</script>

<BreadcrumbSelector
  data={new Map([['Databases', databases.map(makeBreadcrumbSelectorItem)]])}
  triggerLabel="Choose a Database"
/>
