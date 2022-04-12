<script lang="ts">
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import { setContext, createEventDispatcher } from 'svelte';
  import { getLabel as defaultGetLabel } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import type {
    ListBoxProps,
    ListBoxStaticContextProps,
    ListBoxApi,
    ListBoxContextState,
    ListBoxContext,
  } from './ListBoxTypes';

  type Option = $$Generic;
  type $$Props = ListBoxProps<Option>;

  const dispatch = createEventDispatcher();

  export let selectionType: $$Props['selectionType'] = 'multiple';
  export let options: $$Props['options'];
  export let value: $$Props['value'] = [];

  export let searchable: $$Props['searchable'] = false;
  export let disabled: $$Props['disabled'] = false;
  export let labelKey: $$Props['labelKey'] = 'label';
  export let getLabel: $$Props['getLabel'] = defaultGetLabel;
  export let checkEquality: $$Props['checkEquality'] = (
    opt: Option,
    opt2: Option | undefined,
  ) => opt === opt2;
  export let checkIfOptionIsDisabled: $$Props['checkIfOptionIsDisabled'] = () =>
    false;

  const isOpen = writable(false);
  const displayedOptions = writable(Array.isArray(options) ? options : []);
  const focusedOptionIndex = writable(-1);

  function open(): void {
    if (disabled) return;
    $isOpen = true;
  }

  function close(): void {
    if (disabled) return;
    $isOpen = false;
  }

  function toggle(): void {
    if (disabled) return;
    $isOpen = !$isOpen;
  }

  function focusOption(option: Option): void {
    const index = $displayedOptions.findIndex((opt) =>
      checkEquality(option, opt),
    );
    $focusedOptionIndex = index;
  }

  function focusNext(): void {
    const displayOptionLength = $displayedOptions.length;
    $focusedOptionIndex =
      $focusedOptionIndex === displayOptionLength - 1
        ? 0
        : $focusedOptionIndex + 1;
  }

  function focusPrevious(): void {
    const displayOptionLength = $displayedOptions.length;
    $focusedOptionIndex =
      $focusedOptionIndex < 0
        ? displayOptionLength - 1
        : $focusedOptionIndex - 1;
  }

  function isOptionSelected(option: Option): boolean {
    if (selectionType === 'single') {
      return checkEquality(option, value[0]);
    }
    return value.some((opt) => checkEquality(option, opt));
  }

  function select(option: Option): void {
    focusOption(option);
    if (checkIfOptionIsDisabled(option)) {
      return;
    }
    if (isOptionSelected(option)) {
      return;
    }
    if (selectionType === 'single') {
      value = [option];
      close();
    } else {
      value = [...value, option];
    }
    void dispatch('change', value);
  }

  function deselect(option: Option): void {
    focusOption(option);
    if (checkIfOptionIsDisabled(option)) {
      return;
    }
    if (!isOptionSelected(option)) {
      return;
    }
    if (selectionType === 'single') {
      value = [];
      close();
    } else {
      value = value.filter((opt) => !checkEquality(option, opt));
    }
    dispatch('change', value);
  }

  function selectFocused(): void {
    const focusedOption = $displayedOptions[$focusedOptionIndex];
    if (focusedOption) {
      select(focusedOption);
    }
  }

  export const api: ListBoxApi<Option> = {
    open,
    close,
    toggle,
    focusOption,
    focusNext,
    focusPrevious,
    isOptionSelected,
    select,
    deselect,
    selectFocused,
  };

  /**
   * We need the following stores to not have undefined values.
   * We need to update them when props change.
   * The stores cannot be recreated, since we need to set them in context.
   * The only way so far do that is to create a writable with the props, and then
   * a reactive statement which updates the store when those props change.
   *
   * TODO: Check if we can do this in a better manner.
   */

  const valueStore = writable(value);
  $: valueStore.set(value);

  const staticProps: Writable<ListBoxStaticContextProps<Option>> = writable({
    selectionType,
    labelKey,
    getLabel,
    searchable,
    disabled,
    checkEquality,
    checkIfOptionIsDisabled,
  });
  $: staticProps.set({
    selectionType,
    labelKey,
    getLabel,
    searchable,
    disabled,
    checkEquality,
    checkIfOptionIsDisabled,
  });

  const state: ListBoxContextState<Option> = {
    isOpen,
    displayedOptions,
    focusedOptionIndex,
    value: valueStore,
    staticProps,
  };

  setContext<ListBoxContext<Option>>('LISTBOX_CONTEXT', {
    api,
    state,
  });
</script>

<slot {api} />
