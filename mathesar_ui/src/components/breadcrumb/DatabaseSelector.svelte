<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { Connection } from '@mathesar/api/connections';
  import { iconDatabase, iconConnection } from '@mathesar/icons';
  import { getDatabasePageUrl, CONNECTIONS_URL } from '@mathesar/routes/urls';
  import { connectionsStore } from '@mathesar/stores/databases';
  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  const { connections, currentConnectionName } = connectionsStore;

  function makeBreadcrumbSelectorItem(
    connectionEntry: Connection,
  ): BreadcrumbSelectorEntry {
    return {
      type: 'simple',
      label: connectionEntry.nickname,
      href: getDatabasePageUrl(connectionEntry.nickname),
      icon: iconDatabase,
      isActive() {
        return connectionEntry.nickname === $currentConnectionName;
      },
    };
  }
</script>

<BreadcrumbSelector
  data={new Map([
    [$_('connections'), $connections.map(makeBreadcrumbSelectorItem)],
  ])}
  triggerLabel={$_('choose_connection')}
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
