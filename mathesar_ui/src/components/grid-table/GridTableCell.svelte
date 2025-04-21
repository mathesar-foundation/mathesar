<script lang="ts">
  export let header = false;
</script>

<div class="gt-cell" class:gt-header={header} {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .gt-cell {
    display: flex;
    position: relative;
    align-items: center;
    min-height: 100%;
    padding: var(--size-x-small) var(--size-base);
    color: var(--text-color-primary);

    &::before,
    &::after {
      content: '';
      position: absolute;
      background-color: var(--border-color);
      z-index: 1;
    }

    &::before {
      block-size: 100%;
      inline-size: var(--border-radius-xs);
      inset-block-start: 0;
      inset-inline-start: calc(var(--border-radius-xs) * -1);
    }

    &::after {
      inline-size: 100vw;
      block-size: var(--border-radius-xs);
      inset-inline-start: 0;
      inset-block-end: calc(var(--border-radius-xs) * -1);
    }

    &.gt-header {
      font-weight: var(--font-weight-medium);
      color: var(--text-color-secondary);

      &::after {
        background-color: var(--border-color);
      }

      background: linear-gradient(
        to bottom,
        var(--header-gradient-start),
        var(--header-gradient-end)
      );
    }

    &:active {
      background: var(--active-background);
    }
  }
</style>
