<script lang="ts">
  import type { GlobalDatabaseContext } from '../global-context/GlobalDatabaseContext';

  import Settings from './Settings.svelte';

  export let globalDatabaseContext: GlobalDatabaseContext;
</script>

<Settings database={globalDatabaseContext.database} />
