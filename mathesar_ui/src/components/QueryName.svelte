<script lang="ts">
  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import { iconExploration } from '@mathesar/icons';

  import NameWithIcon from './NameWithIcon.svelte';

  export let query: SavedExploration;
</script>

<NameWithIcon icon={iconExploration}>{query.name}</NameWithIcon>
