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
  cssVariables={{ '--icon-color': 'var(--color-database)' }}
>
  <slot databaseDisplayName={database.displayName}>
    {database.displayName}
  </slot>
</NameWithIcon>
