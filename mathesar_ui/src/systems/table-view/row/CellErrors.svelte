<script lang="ts">
  import { onMount } from 'svelte';

  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import type { ClientSideCellError } from '@mathesar/stores/table-data';
  import { popper, portal } from '@mathesar-component-library';

  export let serverErrors: RpcError[] = [];
  export let clientErrors: ClientSideCellError[] = [];
  export let forceShowErrors = false;

  $: errors = [
    ...serverErrors.map((err) => err.message),
    ...clientErrors.map((err) => err.message),
  ];

  let errorIndicatorElement: HTMLElement | undefined;
  let cellElementIsHovered = false;
  let hiderTimeoutId: number;

  function setHover() {
    window.clearTimeout(hiderTimeoutId);
    cellElementIsHovered = true;
  }

  function unsetHover() {
    hiderTimeoutId = window.setTimeout(() => {
      cellElementIsHovered = false;
    }, 1);
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
  $: hasOnlyClientErrors = clientErrors.length && !serverErrors.length;
</script>

<div class="error-indicator" bind:this={errorIndicatorElement}>
  {#if hasOnlyClientErrors}
    <span class="required">*</span>
  {:else}
    <svg viewBox="0 0 10 10">
      <path d="M 0 0 L 10 0 L 10 10 Z" />
    </svg>
  {/if}
</div>
{#if cellElement && showErrors && !hasOnlyClientErrors}
  <div
    class="errors"
    use:portal
    use:popper={{
      reference: cellElement,
      options: { placement: 'top-start' },
    }}
    on:mouseenter={() => setHover()}
    on:mouseleave={() => unsetHover()}
  >
    {errors.join(' ')}
  </div>
{/if}

<style>
  .error-indicator {
    position: absolute;
    top: 0;
    right: 0;
    height: 1em;
    width: 1em;
  }

  path {
    fill: var(--SYS-color-danger-icon);
    stroke: none;
  }

  .required {
    color: var(--SYS-color-danger-icon);
    font-size: var(--lg2);
  }

  .errors {
    background: var(--background-color);
    border: solid 2px var(--SYS-color-danger-border);
    box-shadow:
      #000 0 0 0 0,
      rgba(0, 0, 0, 0.05) 0px 0px 0px 1px,
      rgba(0, 0, 0, 0.1) 0px 10px 15px -3px,
      rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
    border-radius: 0.4em;
    max-width: 20em;
    padding: 0.5em;
    z-index: var(--cell-errors-z-index);
    font-size: var(--sm1);
    word-wrap: break-word;
  }
</style>
