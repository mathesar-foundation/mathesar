<script lang="ts">
  import { _ } from 'svelte-i18n';
  import ConnectionsPage from '@mathesar/pages/connections/ConnectionsPage.svelte';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconConnection } from '@mathesar/icons';
  import { CONNECTIONS_URL } from '@mathesar/routes/urls';
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: CONNECTIONS_URL,
    label: $_('connections'),
    icon: iconConnection,
  }}
/>

<ConnectionsPage />
