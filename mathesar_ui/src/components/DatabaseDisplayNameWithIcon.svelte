<script lang="ts">
  import { iconDatabase } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';

  import NameWithIcon from './NameWithIcon.svelte';

  export let database: Database;
  export let iconHasBox = false;
</script>

<NameWithIcon
  icon={iconDatabase}
  {iconHasBox}
  --icon-color="var(--SYS-accent-amethyst-bright-highlighted)"
>
  {database.displayName}
</NameWithIcon>
