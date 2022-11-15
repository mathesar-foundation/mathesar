<script lang="ts">
  import { Icon } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let icon: IconProps;
</script>

<div class="container">
  <div class="empty-entity">
    <Icon {...icon} />
    <slot />
  </div>
</div>

<style lang="scss">
  .container {
    min-height: 18rem;
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-l);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-entity {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: var(--text-size-large);

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
