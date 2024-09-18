<script lang="ts">
  import type { QueryInstance } from '@mathesar/api/rpc/explorations';
  import { iconExploration } from '@mathesar/icons';

  import NameWithIcon from './NameWithIcon.svelte';

  export let query: QueryInstance;
</script>

<NameWithIcon icon={iconExploration}>{query.name}</NameWithIcon>
