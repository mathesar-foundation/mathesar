<script lang="ts">
  let className = '';
  export { className as class };
  export let style: string | undefined = undefined;
  export let header = false;
  export let divider = false;
</script>

<div class="cell-wrapper {className}" class:header class:divider {style}>
  <slot />
</div>

<style>
  /* TODO: resolve code duplication between here and TableView.scss */
  .cell-wrapper {
    position: absolute;
    height: 100%;
    top: 0;
    border-bottom: var(--cell-border-horizontal);
    border-right: var(--cell-border-vertical);
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .cell-wrapper:first-child {
    border-left: var(--cell-border-vertical);
  }
  .header {
    background: #f7f8f8;
    border-top: var(--cell-border-horizontal);
    /**
     * Padding is chosen to match `button.dropdown.trigger`. It would be good to
     * eliminate this code duplication somehow.
     */
    padding: 5px 26px 5px 12px;
  }
  .divider {
    background: var(--divider-color);
  }
</style>
