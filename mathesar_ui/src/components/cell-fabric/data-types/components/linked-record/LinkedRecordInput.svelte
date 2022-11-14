<script lang="ts">
  import { createEventDispatcher, getContext, tick } from 'svelte';

  // TODO remove dependency cycle
  // eslint-disable-next-line import/no-cycle
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';

  import {
    getGloballyUniqueId,
    getLabelControllerFromContainingLabel,
    getLabelIdFromInputId,
    Icon,
    iconExpandDown,
    type AccompanyingElements,
  } from '@mathesar-component-library';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import type { LinkedRecordCellProps } from '@mathesar/components/cell-fabric/data-types/components/typeDefinitions';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';

  type $$Props = LinkedRecordCellProps & {
    class?: string;
    id?: string;
    allowsHyperlinks?: boolean;
  };

  const labelController = getLabelControllerFromContainingLabel();
  const recordSelector = getRecordSelectorFromContext();
  const dropdownAccompanyingElements = getContext<
    AccompanyingElements | undefined
  >('dropdownAccompanyingElements');
  const dispatch = createEventDispatcher();

  export let id = getGloballyUniqueId();
  export let value: $$Props['value'] = undefined;
  export let recordSummary: $$Props['recordSummary'] = undefined;
  export let setRecordSummary: Required<$$Props>['setRecordSummary'] = () => {};
  export let tableId: $$Props['tableId'];
  let classes: $$Props['class'] = '';
  export { classes as class };
  export let allowsHyperlinks = true;

  let isAcquiringInput = false;
  let element: HTMLSpanElement | undefined;

  $: hasValue = value !== undefined && value !== null;
  $: labelController?.inputId.set(id);
  $: recordPageHref =
    hasValue && allowsHyperlinks
      ? $storeToGetRecordPageUrl({ tableId, recordId: value })
      : undefined;

  function clear() {
    value = undefined;
    dispatch('artificialChange', undefined);
    dispatch('artificialInput', undefined);
    // If the value is cleared via a button, the focus may shift to that button.
    // We'd like to shift it back to the input element to that the user can
    // press `Enter` to launch the record selector.
    element?.focus();
  }

  /**
   * If this LinkedRecordInput in placed inside an AttachableDropdown, we want
   * to tell the dropdown not to close when the user clicks within the Record
   * Selector UI, so we set the modal element to "accompany" the dropdown.
   */
  function setRecordSelectorToAccompanyDropdown(): () => void {
    if (!dropdownAccompanyingElements) {
      return () => {};
    }
    const modal = document.querySelector<HTMLElement>('.modal-record-selector');
    if (!modal) {
      return () => {};
    }
    return dropdownAccompanyingElements.add(modal);
  }

  async function launchRecordSelector() {
    dispatch('recordSelectorOpen');
    isAcquiringInput = true;
    const recordSelectorPromise = recordSelector.acquireUserInput({ tableId });
    await tick();
    const cleanupDropdown = setRecordSelectorToAccompanyDropdown();
    const result = await recordSelectorPromise;
    cleanupDropdown();
    isAcquiringInput = false;
    if (result === undefined) {
      dispatch('recordSelectorCancel');
    } else {
      value = result.recordId;
      setRecordSummary(String(result.recordId), result.recordSummary);
      dispatch('recordSelectorSubmit');
      dispatch('artificialChange', value);
      dispatch('artificialInput', value);
    }
    await tick();
    element?.focus();
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
  {id}
  class="input-element linked-record-input {classes}"
  class:has-value={hasValue}
  class:is-acquiring-input={isAcquiringInput}
  tabindex={isAcquiringInput ? undefined : 0}
  bind:this={element}
  on:click={launchRecordSelector}
  on:focus={handleFocus}
  on:focus
  on:blur={handleBlur}
  on:blur
  role="listbox"
  aria-labelledby={getLabelIdFromInputId(id)}
>
  <span class="content">
    {#if hasValue}
      <LinkedRecord
        recordId={value}
        {recordSummary}
        hasDeleteButton
        on:delete={clear}
        {recordPageHref}
      />
    {/if}
  </span>
  <!--
    Why is `.dropdown-button` not an actual `button` element? Because we need to
    be able to nest this entire LinkedRecordInput inside a label and we don't
    want to semantically associate the button with the label. There may be a
    better way to do this from an a11y perspective.
   -->
  <span
    class="dropdown-button"
    on:click={launchRecordSelector}
    role="button"
    tabindex="-1"
    aria-label="Pick a record"
    title="Pick a record"
  >
    <Icon {...iconExpandDown} />
  </span>
</span>

<style>
  /* TODO resolve some code duplication with `.input-element` */
  .linked-record-input {
    width: 100%;
    display: grid;
    grid-template: auto / 1fr auto;
    position: relative;
    isolation: isolate;
    border: 1px solid #dfdfdf;
    border-radius: 0.25rem;
    background: #fff;
    min-height: 2.25em;
    padding: 0;
    --padding: 0.5rem;
    cursor: default;
  }

  .linked-record-input:focus {
    border-color: #489ee4;
    outline: 0;
    box-shadow: 0 0 0 2px #2087e633;
  }

  .content {
    position: relative;
    display: block;
    padding: var(--padding);
    padding-right: 0;
    z-index: 2;
  }
  .dropdown-button {
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--color-gray-dark);
    padding: var(--padding);
  }
  .dropdown-button:hover {
    color: var(--color-text);
  }
</style>
