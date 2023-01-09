<script lang="ts">
  import { Icon } from '@mathesar/component-library';
  import type { IconProps } from '@mathesar/component-library/types';

  export let icon: IconProps;
</script>

<span class="type-icon"><Icon {...icon} size="0.9rem" /></span>

<style>
  .type-icon {
    color: var(--slate-300);
    display: inline-flex;
  }
</style>
