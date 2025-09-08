<script lang="ts">
  import { Button, Icon } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let changeView: () => void;

  export let icon: IconProps;
  export let header: string;
  export let description: string;
</script>

<div class="connect-option">
  <Button on:click={changeView} appearance="custom">
    <div class="content">
      <div class="icon-circle">
        <Icon {...icon} size="2rem" />
      </div>
      <div>
        <div class="header">
          {header}
        </div>
        <div class="description">
          {description}
        </div>
      </div>
    </div>
  </Button>
</div>

<style lang="scss">
  .connect-option {
    display: grid;
    --button-background: var(--color-surface-raised-3);
    --button-color: var(--text-control);
    --button-border-color: var(--color-surface-raised-3-border);
    --button-box-shadow: 0 1px 2px
        color-mix(in srgb, var(--color-shadow), transparent 5%),
      0 1px 3px color-mix(in srgb, var(--color-shadow), transparent 10%),
      0 1px 2px -1px color-mix(in srgb, var(--color-shadow), transparent 10%);

    --button-hover-background: var(--color-database-10-hover);
    --button-hover-border-color: var(--color-database-20-hover);
    --button-hover-box-shadow: 0 4px 6px -1px color-mix(in srgb, var(--color-shadow), transparent
            10%),
      0 2px 4px -2px color-mix(in srgb, var(--color-shadow), transparent 10%),
      0 0 0 1px color-mix(in srgb, var(--color-shadow), transparent 5%) inset;

    --button-focus-outline: 2px solid;
    --button-focus-outline-color: var(--color-database-40);

    --button-active-background: var(--color-database-10-active);
    --button-active-border-color: var(--color-database-20-active);
    --button-active-box-shadow: 0 1px 2px
        color-mix(in srgb, var(--color-shadow), transparent 5%),
      0 1px 3px color-mix(in srgb, var(--color-shadow), transparent 10%),
      0 1px 2px -1px color-mix(in srgb, var(--color-shadow), transparent 10%);
  }
  .content {
    display: grid;
    align-items: center;
    grid-template-columns: auto 1fr;
    gap: var(--lg1);
    text-align: left;
    padding: var(--sm4);
  }
  .icon-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-database-80);
  }
  .header {
    font-size: var(--lg1);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
  }
  .description {
    color: var(--text-tertiary);
    margin-top: var(--sm4);
  }
</style>
