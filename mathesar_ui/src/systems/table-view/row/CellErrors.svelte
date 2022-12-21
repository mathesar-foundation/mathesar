<script lang="ts">
  import { popper, portal } from '@mathesar-component-library';
  import { onMount } from 'svelte';

  export let errors: string[];
  export let forceShowErrors = false;

  let errorIndicatorElement: SVGSVGElement | undefined;
  let cellElementIsHovered = false;

  function setHover() {
    cellElementIsHovered = true;
  }
  function unsetHover() {
    cellElementIsHovered = false;
  }
  onMount(() => {
    const cell = errorIndicatorElement?.parentElement;
    if (!cell) {
      return () => {};
    }
    cell.addEventListener('mouseenter', setHover);
    cell.addEventListener('mouseleave', unsetHover);
    return () => {
      cell.removeEventListener('mouseenter', setHover);
      cell.removeEventListener('mouseleave', unsetHover);
    };
  });

  $: cellElement = errorIndicatorElement?.parentElement;
  $: showErrors = cellElementIsHovered || forceShowErrors;
</script>

<svg
  bind:this={errorIndicatorElement}
  class="error-indicator"
  viewBox="0 0 10 10"
>
  <path d="M 0 0 L 10 0 L 10 10 Z" />
</svg>
{#if cellElement && showErrors}
  <div
    class="errors"
    use:portal
    use:popper={{
      reference: cellElement,
      options: { placement: 'top-start' },
    }}
  >
    {errors.join(' ')}
  </div>
{/if}

<style>
  svg {
    position: absolute;
    top: 0;
    right: 0;
    height: 1em;
    width: 1em;
  }

  path {
    fill: rgba(255, 0, 0, 0.5);
    stroke: none;
  }

  .errors {
    background: var(--slate-100);
    border: solid 0.1em #ffa1a1;
    box-shadow: #000 0 0 0 0, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px,
      rgba(0, 0, 0, 0.1) 0px 10px 15px -3px,
      rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
    border-radius: 0.4em;
    max-width: 20em;
    padding: 0.5em;
    z-index: var(--cell-errors-z-index);
  }
</style>
