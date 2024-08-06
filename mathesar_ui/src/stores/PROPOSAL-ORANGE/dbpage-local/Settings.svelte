<script lang="ts">
  import { onMount } from 'svelte';

  import AsyncStore from '@mathesar/stores/AsyncStore';

  import type { ConfiguredRole } from '../models/ConfiguredRole';
  import type { Database } from '../models/Database';
  import type { Role } from '../models/Role';
  import { batchRequests } from '../utils';

  export let database: Database;

  const configuredRoles: AsyncStore<void, ConfiguredRole[]> = new AsyncStore(
    () => database.server.requestConfiguredRoles(),
  );

  const roles: AsyncStore<void, Role[]> = new AsyncStore(() =>
    database.requestRoles(),
  );

  onMount(() => {
    batchRequests([configuredRoles.batchRunner(), roles.batchRunner()]);
  });
</script>
