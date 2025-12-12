<script lang="ts">
  import { Icon } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let icon: IconProps;
  export let text: string;
</script>

<div class="empty-entity-list">
  <div class="content">
    <Icon {...icon} />
    <span>{text}</span>
  </div>
</div>

<style lang="scss">
  .empty-entity-list {
    min-height: var(--lg3);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-l);
    --color: color-mix(in srgb, var(--color-fg-base), transparent 92%);
    background: radial-gradient(
      circle at bottom right,
      var(--color) 0%,
      transparent 60%
    );
  }

  .content {
    display: flex;
    gap: var(--sm4);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1.5rem;
    color: var(--color-fg-subtle-2);

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
