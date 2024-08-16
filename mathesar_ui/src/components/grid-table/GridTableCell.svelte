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

    &::before,
    &::after {
      content: '';
      position: absolute;
      background-color: var(--Grid-table__cell-border-color-internal);
      z-index: 1;
    }
    // row
    &::after {
      inline-size: 100vw;
      block-size: var(--Grid-table__border-size-internal);
      inset-inline-start: 0;
      inset-block-end: calc(var(--Grid-table__border-size-internal) * -1);
    }
    // column
    &::before {
      inline-size: var(--Grid-table__border-size-internal);
      block-size: 100vh;
      inset-inline-start: calc(var(--Grid-table__border-size-internal) * -1);
    }

    &.gt-header {
      font-weight: 500;

      &::after {
        background-color: var(--Grid-table__border-color-internal);
      }
    }
  }
</style>
