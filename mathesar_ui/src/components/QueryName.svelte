<script lang="ts">
  import type { QueryInstance } from '@mathesar/api/queries/queryList';
  import { iconQuery } from '@mathesar/icons';
  import NameWithIcon from './NameWithIcon.svelte';

  export let query: QueryInstance;
</script>

<NameWithIcon icon={iconQuery}>{query.name}</NameWithIcon>
