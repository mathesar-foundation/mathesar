<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  // TODO remove dependency cycle
  // eslint-disable-next-line import/no-cycle
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import type { LinkedRecordCellProps } from '@mathesar/components/cell-fabric/data-types/components/typeDefinitions';
  import LaunchCue from './LaunchCue.svelte';
  import ClearCue from './ClearCue.svelte';

  type $$Props = LinkedRecordCellProps & {
    class?: string;
    containerClass?: string;
  };

  const recordSelector = getRecordSelectorFromContext();
  const dispatch = createEventDispatcher();

  export let value: $$Props['value'] = undefined;
  export let tableId: $$Props['tableId'];
  let classes: $$Props['class'] = '';
  export { classes as class };
  export let containerClass = '';

  let isAcquiringInput = false;
  let element: HTMLSpanElement;

  $: hasValue = value !== undefined && value !== null;

  function clear() {
    value = undefined;
    // If the value is cleared via the ClearCue, the focus will shift to the
    // clear button in the ClearCue. We'd like to shift it back to the input
    // element to that the user can press `Enter` to launch the record selector.
    element.focus();
  }

  async function launchRecordSelector() {
    console.log('LAUNCH');
    dispatch('recordSelectorOpen');
    isAcquiringInput = true;
    const newValue = await recordSelector.acquireUserInput({ tableId });
    isAcquiringInput = false;
    if (newValue === undefined) {
      dispatch('recordSelectorCancel');
      return;
    }
    value = newValue;
    dispatch('recordSelectorSubmit');
  }

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        void launchRecordSelector();
        break;
      case 'Delete':
        clear();
        break;
      default:
        break;
    }
  }

  function handleFocus() {
    window.addEventListener('keydown', handleKeydown);
  }
  function handleBlur() {
    window.removeEventListener('keydown', handleKeydown);
  }
</script>

<span
  class="linked-record-input {containerClass}"
  class:has-value={hasValue}
  class:is-acquiring-input={isAcquiringInput}
  tabindex="0"
  bind:this={element}
  on:dblclick={launchRecordSelector}
  on:focus={handleFocus}
  on:focus
  on:blur={handleBlur}
  on:blur
>
  {#if hasValue}
    <span class="content">
      <LinkedRecord recordId={value} />
    </span>
    <ClearCue on:click={clear} />
  {:else if !isAcquiringInput}
    <LaunchCue on:click={launchRecordSelector} />
  {/if}
</span>

<style>
  /* TODO resolve code duplication with `.input-element` */
  .linked-record-input {
    /**
     * This size is hard-coded because we need to leave room for it, but for
     * z-layering reasons we don't want to include it within the content
     */
    --clear-button-width: 2.2em;
    width: 100%;
    display: block;
    position: relative;
    border: 1px solid #dfdfdf;
    border-radius: 0.25rem;
    background: #fff;
    min-height: 2.25em;
  }

  .linked-record-input:focus {
    border-color: #489ee4;
    outline: 0;
    box-shadow: 0 0 0 2px #2087e633;
  }

  .content {
    position: relative;
    display: block;
    width: calc(100% - var(--clear-button-width));
    padding: 6px;
    z-index: 2;
  }
</style>
