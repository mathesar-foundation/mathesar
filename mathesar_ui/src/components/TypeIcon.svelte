<script lang="ts">
  import { Icon } from '@mathesar/component-library';
  import type { IconProps } from '@mathesar/component-library/types';

  export let icon: IconProps;
</script>

<span class="type-icon"><Icon {...icon} /></span>

<style>
  .type-icon {
    color: #aaa;
  }
</style>
