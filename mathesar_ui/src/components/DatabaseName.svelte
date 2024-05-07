<script lang="ts">
  import type { Database } from '@mathesar/AppTypes';
  import { iconDatabase } from '@mathesar/icons';

  import NameWithIcon from './NameWithIcon.svelte';

  export let database: Database;
  export let iconHasBox = false;
</script>

<NameWithIcon icon={iconDatabase} {iconHasBox}>
  {database.nickname}
</NameWithIcon>
