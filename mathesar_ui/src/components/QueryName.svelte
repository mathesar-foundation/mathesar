<script lang="ts">
  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import { iconExploration } from '@mathesar/icons';

  import NameWithIcon from './NameWithIcon.svelte';

  export let query: SavedExploration;

  $: ({ name } = query);
</script>

<NameWithIcon
  icon={iconExploration}
  --icon-color="var(--SYS-accent-pumpkin-contrast)">{query}</NameWithIcon
>
