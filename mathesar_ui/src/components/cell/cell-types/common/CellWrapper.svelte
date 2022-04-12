<script lang="ts">
  export let element: HTMLElement;

  export let isActive: boolean;
  export let readonly: boolean;
  export let disabled: boolean;
  export let mode: 'edit' | 'default' = 'default';
  export let multiLineTruncate = false;
</script>

<div
  class="cell-wrapper"
  class:is-active={isActive}
  class:readonly
  class:disabled
  class:is-edit-mode={mode === 'edit'}
  class:truncate={multiLineTruncate}
  bind:this={element}
  on:click
  on:dblclick
  on:mousedown
  on:keydown
  tabindex={-1}
>
  <slot />
</div>

<style lang="scss">
  .cell-wrapper {
    overflow: hidden;
    padding: 6px 8px;

    &.is-active {
      box-shadow: 0 0 0 2px #428af4;
      border-radius: 2px;

      &.readonly {
        box-shadow: 0 0 0 2px #a8a8a8;
      }
    }

    :global(.input-element) {
      box-shadow: none;

      &:focus {
        border: none;
      }
    }

    &.is-edit-mode {
      padding: 0px;
      box-shadow: 0 0 0 3px #428af4, 0 0 8px #000000 !important;
    }

    &.truncate {
      :global(textarea.input-element) {
        resize: vertical;
        min-height: 5em;
      }
    }
  }
</style>
