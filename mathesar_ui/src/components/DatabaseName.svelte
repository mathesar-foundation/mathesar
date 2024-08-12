<script lang="ts">
  import { iconDatabase } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/databases';

  import NameWithIcon from './NameWithIcon.svelte';

  export let database: Database;
  export let iconHasBox = false;
</script>

<NameWithIcon icon={iconDatabase} {iconHasBox}>
  {database.name}
</NameWithIcon>
