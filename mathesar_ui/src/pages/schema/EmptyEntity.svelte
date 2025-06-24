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
    min-height: 12rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-l);
  }

  .empty-entity {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1.5rem;
    color: var(--text-color-secondary);

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
