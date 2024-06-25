<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Connection } from '@mathesar/api/rest/connections';
  import { iconConnection, iconDatabase } from '@mathesar/icons';
  import { CONNECTIONS_URL, getDatabasePageUrl } from '@mathesar/routes/urls';
  import { connectionsStore } from '@mathesar/stores/databases';

  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  const { connections, currentConnectionId } = connectionsStore;

  function makeBreadcrumbSelectorEntry(
    connection: Connection,
  ): BreadcrumbSelectorEntry {
    return {
      type: 'simple',
      label: connection.nickname,
      href: getDatabasePageUrl(connection.id),
      icon: iconDatabase,
      isActive: () => connection.id === $currentConnectionId,
    };
  }

  $: breadcrumbEntries = [...$connections.values()].map(
    makeBreadcrumbSelectorEntry,
  );
</script>

<BreadcrumbSelector
  data={new Map([[$_('connections'), breadcrumbEntries]])}
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
