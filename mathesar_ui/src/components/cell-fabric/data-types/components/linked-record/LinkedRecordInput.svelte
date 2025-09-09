<script lang="ts">
  import { createEventDispatcher, getContext, onMount, tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import BaseInput from '@mathesar/component-library/common/base-components/BaseInput.svelte';
  import type { LinkedRecordInputProps } from '@mathesar/components/cell-fabric/data-types/components/typeDefinitions';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import type { RecordSelectionOrchestratorFactory } from '@mathesar/systems/record-selection-orchestrator/RecordSelectionOrchestrator';
  import {
    type AccompanyingElements,
    Icon,
    getGloballyUniqueId,
    getLabelControllerFromContainingLabel,
    getLabelIdFromInputId,
    iconExpandDown,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type { LinkedRecordInputElement } from './LinkedRecordUtils';

  interface $$Props
    extends Omit<
      LinkedRecordInputProps,
      'isActive' | 'isSelected' | 'isProcessing' | 'isIndependentOfSheet'
    > {
    class?: string;
    id?: string;
    allowsHyperlinks?: boolean;
    placeholder?: string;
  }

  const labelController = getLabelControllerFromContainingLabel();
  const dropdownAccompanyingElements = getContext<
    AccompanyingElements | undefined
  >('dropdownAccompanyingElements');
  const dispatch = createEventDispatcher();

  export let id = getGloballyUniqueId();
  export let value: $$Props['value'] = undefined;
  export let recordSelectionOrchestratorFactory: RecordSelectionOrchestratorFactory;
  export let recordSummary: $$Props['recordSummary'] = undefined;
  export let setRecordSummary: Required<$$Props>['setRecordSummary'] = () => {};
  export let targetTableId: $$Props['targetTableId'] | undefined = undefined;
  let classes: $$Props['class'] = '';
  export { classes as class };
  export let allowsHyperlinks = false;
  export let disabled = false;
  export let placeholder: string | undefined = undefined;

  let element: HTMLSpanElement;

  $: recordSelectionOrchestrator = recordSelectionOrchestratorFactory();
  $: hasValue = value !== undefined && value !== null;
  $: labelController?.inputId.set(id);

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
    if (disabled) {
      return;
    }
    dispatch('recordSelectorOpen');
    const previousValue = {
      summary: recordSummary ?? '',
      key: value ?? null,
    };
    const userSelection = recordSelectionOrchestrator.launch({
      triggerElement: element,
      previousValue,
    });
    await tick();
    const cleanupDropdown = setRecordSelectorToAccompanyDropdown();
    try {
      const record = await userSelection;
      cleanupDropdown();
      if (isDefinedNonNullable(record)) {
        value = record.key;
        setRecordSummary(String(record.key), record.summary);
      } else {
        value = null;
      }
      dispatch('recordSelectorSubmit');
      dispatch('artificialChange', value);
      dispatch('artificialInput', value);
    } catch {
      cleanupDropdown();
      dispatch('recordSelectorCancel');
    }
    await tick();
    element.focus();
  }

  function clear() {
    value = null;
    dispatch('artificialChange', value);
    dispatch('artificialInput', value);
    if (recordSelectionOrchestrator.isOpen()) {
      recordSelectionOrchestrator.close();
      void launchRecordSelector();
    } else {
      // If the value is cleared via a button, the focus may shift to that button.
      // We'd like to shift it back to the input element to that the user can
      // press `Enter` to launch the record selector.
      element.focus();
    }
  }

  async function toggleRecordSelector() {
    // I added `tick` because I was observing a race condition when opening a
    // nested record selector. It would open correctly about 80% of the time.
    // But 20% of the time it would not open because it would cancel.
    await tick();

    if (recordSelectionOrchestrator.isOpen()) {
      recordSelectionOrchestrator.close();
    } else {
      await launchRecordSelector();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (e.target === element) {
          void toggleRecordSelector();
        }
        break;
      case 'Delete':
      case 'Backspace':
        clear();
        recordSelectionOrchestrator.close();
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

  onMount(() => {
    (element as LinkedRecordInputElement).launchRecordSelector =
      launchRecordSelector;
  });
</script>

<BaseInput {disabled} {...$$restProps} bind:id />

<span
  {id}
  class="input-element linked-record-input {classes}"
  class:has-value={hasValue}
  class:disabled
  tabindex={disabled ? undefined : 0}
  bind:this={element}
  on:click={toggleRecordSelector}
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
        hasDeleteButton={!disabled}
        on:delete={clear}
        {disabled}
        tableId={targetTableId}
        {allowsHyperlinks}
      />
    {:else if placeholder}
      <span class="placeholder">
        {placeholder}
      </span>
    {/if}
  </span>
  {#if !disabled}
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
      aria-label={$_('pick_record')}
      title={$_('pick_record')}
    >
      <Icon {...iconExpandDown} />
    </span>
  {/if}
</span>

<style>
  /* TODO resolve some code duplication with `.input-element` */
  .linked-record-input {
    width: 100%;
    display: grid;
    grid-template: auto / 1fr auto;
    position: relative;
    isolation: isolate;
    border: 1px solid var(--border-section);
    border-radius: 0.25rem;
    background: var(--color-surface-input);
    padding: var(--sm4);
    cursor: default;
  }
  .disabled {
    background: var(--color-surface-input-disabled);
    border: solid 1px var(--border-input);
  }

  .linked-record-input:focus {
    border-color: var(--border-input-focused);
    outline: 0;
    box-shadow: 0 0 0 2px var(--color-surface-input-focused);
  }

  .content {
    position: relative;
    display: block;
    padding: 0;
    z-index: 2;
  }

  .placeholder {
    color: var(--text-color-muted);
    font-style: italic;
  }

  .dropdown-button {
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--text-primary);
    padding: var(--padding);
  }
  .dropdown-button:hover {
    color: var(--text-primary);
  }
</style>
