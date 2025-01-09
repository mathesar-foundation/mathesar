<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconDatabase } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import { databasesStore } from '@mathesar/stores/databases';

  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  const { databases, currentDatabase } = databasesStore;

  function makeBreadcrumbSelectorEntry(
    database: Database,
  ): BreadcrumbSelectorEntry {
    return {
      type: 'simple',
      label: database.name,
      href: getDatabasePageUrl(database.id),
      icon: iconDatabase,
      isActive: () => database.id === $currentDatabase?.id,
    };
  }

  $: entries = [...$databases.values()].map(makeBreadcrumbSelectorEntry);
</script>

<BreadcrumbSelector
  sections={[
    {
      label: $_('databases'),
      entries,
      emptyMessage: $_('no_databases_connected'),
    },
  ]}
  triggerLabel={$_('choose_database')}
/>
