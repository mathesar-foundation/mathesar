<script lang="ts">
  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import { iconExploration } from '@mathesar/icons';

  import NameWithIcon from './NameWithIcon.svelte';

  export let query: Pick<SavedExploration, 'id' | 'name'>;

  $: ({ name } = query);
</script>

<NameWithIcon icon={iconExploration} --icon-color="var(--color-exploration)">
  <slot queryName={name}>
    {name}
  </slot>
</NameWithIcon>
