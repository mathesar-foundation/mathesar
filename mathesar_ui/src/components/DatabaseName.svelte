<script lang="ts">
  import type { Database } from '@mathesar/AppTypes';
  import { iconDatabase } from '@mathesar/icons';
  import NameWithIcon from './NameWithIcon.svelte';

  export let database: Database;
</script>

<NameWithIcon icon={iconDatabase}>{database.name}</NameWithIcon>
