<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { faBackspace, faSearchPlus } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '@mathesar/component-library';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  // TODO remove dependency cycle
  // eslint-disable-next-line import/no-cycle
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import type { LinkedRecordCellProps } from '../typeDefinitions';

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
  let hoverTarget: 'launch' | 'clear' | undefined = undefined;

  $: hasValue = value !== undefined && value !== null;

  async function launchRecordSelector() {
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
</script>

<span
  class="linked-record-input-container {containerClass}"
  class:has-value={hasValue}
  class:is-acquiring-input={isAcquiringInput}
  class:is-hovering-clear={hoverTarget === 'clear'}
  class:is-hovering-launch={hoverTarget === 'launch'}
>
  <span
    class="linked-record-input {classes} absolute-block"
    tabindex="0"
    role="button"
    aria-label="Select record"
    title="Select record"
    on:focus={launchRecordSelector}
    on:mouseenter={() => {
      hoverTarget = 'launch';
    }}
    on:mouseleave={() => {
      hoverTarget = undefined;
    }}
  >
    {#if hasValue}
      <span class="value">
        <LinkedRecord primaryKeyCellValue={value} />
      </span>
    {/if}
  </span>

  <span
    class="clear-button absolute-block"
    role="button"
    aria-label="Clear value"
    title="Clear value"
    on:mouseenter={() => {
      hoverTarget = 'clear';
    }}
    on:mouseleave={() => {
      hoverTarget = undefined;
    }}
    on:click={() => {
      value = undefined;
    }}
  >
    <Icon data={faBackspace} />
  </span>

  <span class="cue-launch absolute-block">
    <Icon data={faSearchPlus} />
  </span>
  <span class="cue-clear absolute-block" />
</span>

<style>
  /**
   * Utility CSS
   */

  .absolute-block {
    display: block;
    position: absolute;
    height: 100%;
    top: 0;
    display: flex;
    align-items: center;
  }

  /**
   * Semantic CSS
   */

  /* TODO resolve code duplication with `.input-element` */
  .linked-record-input-container {
    width: 100%;
    box-sizing: border-box;
    display: block;
    position: relative;
    /* TODO Explain why this needs a hard-coded size */
    --clear-button-width: 2.2em;
  }

  .linked-record-input {
    width: 100%;
    border: 1px solid #dfdfdf;
    border-radius: 0.25rem;
    background: #fff;
    z-index: 1;
    cursor: pointer;
  }
  .linked-record-input:focus {
    border-color: #489ee4;
    outline: 0;
    box-shadow: 0 0 0 2px #2087e633;
  }

  .value {
    display: block;
    width: 100%;
    padding: 6px var(--clear-button-width) 6px 8px;
  }

  .clear-button {
    right: 0;
    width: var(--clear-button-width);
    justify-content: center;
    z-index: 3;
    cursor: pointer;
    padding: 0 0.4em;
    color: #aaa;
  }
  .clear-button:hover {
    color: black;
  }
  .linked-record-input-container:not(.has-value) .clear-button {
    display: none;
  }

  .cue-clear {
    width: 100%;
    pointer-events: none;
    background: rgba(255, 255, 255, 0.5);
    z-index: 2;
  }
  .linked-record-input-container:not(.is-hovering-clear) .cue-clear {
    display: none;
  }

  .cue-launch {
    width: 100%;
    pointer-events: none;
    padding-left: 1em;
    cursor: pointer;
    color: #aaa;
    z-index: 2;
  }
  .linked-record-input-container.is-hovering-launch .cue-launch {
    background: rgba(230, 230, 230, 0.6);
    color: #555;
  }
  .linked-record-input-container.has-value.is-hovering-launch .cue-launch {
    justify-content: center;
  }
  .linked-record-input-container.is-acquiring-input .cue-launch,
  .linked-record-input-container.has-value:not(.is-hovering-launch)
    .cue-launch {
    display: none;
  }
</style>
