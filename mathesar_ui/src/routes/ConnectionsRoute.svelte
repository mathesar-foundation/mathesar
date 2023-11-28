<script lang="ts">
  import ConnectionsPage from '@mathesar/pages/connections/ConnectionsPage.svelte';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconDatabase } from '@mathesar/icons';
  import { CONNECTIONS_URL } from '@mathesar/routes/urls';
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: CONNECTIONS_URL,
    label: 'Add Database Connection',
    icon: iconDatabase,
  }}
/>

<ConnectionsPage />
