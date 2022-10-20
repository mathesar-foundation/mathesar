<script lang="ts">
  let className = '';
  export { className as class };
  export let style: string | undefined = undefined;
  export let cellType:
    | 'columnHeader'
    | 'searchInput'
    | 'divider'
    | 'rowHeader'
    | 'data';
  export let state: 'focused' | 'acquiringFkValue' | undefined = undefined;
</script>

<div
  class="cell-wrapper {className}"
  class:is-column-header={cellType === 'columnHeader'}
  class:is-divider={cellType === 'divider'}
  class:has-outline={state === 'focused' || state === 'acquiringFkValue'}
  class:is-acquiring-fk-value={state === 'acquiringFkValue'}
  {style}
>
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
  .is-column-header {
    background: #f7f8f8;
    border-top: var(--cell-border-horizontal);
    /**
     * Padding is chosen to match `button.dropdown.trigger`. It would be good to
     * eliminate this code duplication somehow.
     */
    padding: 5px 26px 5px 12px;
  }
  .is-divider {
    background: var(--divider-color);
  }
  .has-outline {
    --outline-color: #428af4;
    z-index: var(--z-index-above-overlay);
    border-radius: 2px;
    box-shadow: 0 0 0 3px var(--outline-color);
  }
  .is-acquiring-fk-value {
    --outline-color: #888;
    pointer-events: none;
  }
</style>
