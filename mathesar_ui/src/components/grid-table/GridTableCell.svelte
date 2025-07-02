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
    padding: var(--sm2) 1rem;
    color: var(--text-primary);
    border: 1px solid var(--border-row);

    &::before,
    &::after {
      content: '';
      position: absolute;
      background-color: var(--surface-card);
      z-index: 1;
    }

    &::before {
      block-size: 100%;
      inline-size: 1px;
      inset-block-start: 0;
      inset-inline-end: 0;
    }

    &::after {
      inline-size: 100%;
      block-size: 1px;
      inset-inline-start: 0;
      inset-block-end: 0;
    }

    &.gt-header {
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      background: var(--surface-elevated-header);

      &::after {
        background-color: var(--surface-elevated-header);
      }
    }
  }
</style>
