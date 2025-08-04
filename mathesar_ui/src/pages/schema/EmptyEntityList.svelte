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
    background-color: var(--disabled-background);
    border: 1px solid var(--card-border);
  }

  .content {
    display: flex;
    gap: var(--sm4);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1.5rem;
    color: var(--text-secondary);

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
