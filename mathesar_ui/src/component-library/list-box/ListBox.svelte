<script lang="ts">
  import { createEventDispatcher, onMount, setContext } from 'svelte';
  import { type Writable, writable } from 'svelte/store';

  import { getLabel as defaultGetLabel } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import type {
    ListBoxApi,
    ListBoxContext,
    ListBoxContextState,
    ListBoxProps,
    ListBoxStaticContextProps,
  } from './ListBoxTypes';

  type Option = $$Generic;
  type $$Props = ListBoxProps<Option>;
  type DefinedProps = Required<$$Props>;

  interface $$Slots {
    default: {
      api: ListBoxApi<Option>;
      isOpen: boolean;
    };
  }

  const dispatch = createEventDispatcher<{
    change: DefinedProps['value'];
    pick: Option;
  }>();

  export let selectionType: DefinedProps['selectionType'] = 'multiple';
  export let options: DefinedProps['options'] = [];
  export let value: DefinedProps['value'] = [];

  export let searchable: DefinedProps['searchable'] = false;
  export let disabled: DefinedProps['disabled'] = false;
  export let labelKey: DefinedProps['labelKey'] = 'label';
  export let getLabel: DefinedProps['getLabel'] = (option: Option) =>
    defaultGetLabel(option, labelKey);
  export let checkEquality: DefinedProps['checkEquality'] = (
    opt: Option,
    opt2: Option,
  ) => opt === opt2;
  export let checkIfOptionIsDisabled: DefinedProps['checkIfOptionIsDisabled'] =
    () => false;
  export let mode: DefinedProps['mode'] = 'dropdown';

  const isOpen = writable(false);
  const focusedOptionIndex = writable(-1);
  const displayedOptions = writable(Array.isArray(options) ? options : []);
  $: displayedOptions.set(Array.isArray(options) ? options : []);

  function focusSelected(): void {
    const lastSelectedOption = value[value.length - 1];
    $focusedOptionIndex = $displayedOptions.findIndex((opt) =>
      checkEquality(lastSelectedOption, opt),
    );
  }
  $: value, $displayedOptions, focusSelected();

  onMount(() => {
    if (mode === 'static') {
      focusSelected();
    }
  });

  function open(): void {
    if (disabled) return;
    $isOpen = true;
    focusSelected();
  }

  function close(): void {
    if (disabled) return;
    $isOpen = false;
  }

  function toggle(): void {
    if (disabled) return;
    $isOpen ? close() : open();
  }

  function focusOption(option: Option): void {
    const index = $displayedOptions.findIndex((opt) =>
      checkEquality(option, opt),
    );
    if (index >= 0) $focusedOptionIndex = index;
  }

  function focusNext(): void {
    const len = $displayedOptions.length;
    if (len === 0) return;
    $focusedOptionIndex = ($focusedOptionIndex + 1) % len;
  }

  function focusPrevious(): void {
    const len = $displayedOptions.length;
    if (len === 0) return;
    $focusedOptionIndex = ($focusedOptionIndex - 1 + len) % len;
  }

  function isOptionSelected(option: Option): boolean {
    if (selectionType === 'single') {
      return checkEquality(option, value[0]);
    }
    return value.some((opt) => checkEquality(option, opt));
  }

  function select(option: Option): void {
    focusOption(option);
    if (checkIfOptionIsDisabled(option)) return;

    if (isOptionSelected(option)) {
      if (selectionType === 'single') close();
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
    if (checkIfOptionIsDisabled(option)) return;
    if (!isOptionSelected(option)) return;

    if (selectionType === 'single') {
      value = [];
      close();
    } else {
      value = value.filter((opt) => !checkEquality(option, opt));
    }

    dispatch('change', value);
  }

  function pick(option: Option): void {
    if (selectionType === 'single') select(option);
    else isOptionSelected(option) ? deselect(option) : select(option);
    dispatch('pick', option);
  }

  function pickFocused(): void {
    const focusedOption = $displayedOptions[$focusedOptionIndex];
    if (focusedOption) pick(focusedOption);
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if ($isOpen || mode !== 'dropdown') {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          focusNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          focusPrevious();
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Enter':
          e.preventDefault();
          pickFocused();
          break;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      open();
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
    pick,
    pickFocused,
    handleKeyDown,
  };

  const valueStore = writable(value);
  $: valueStore.set(value);

  const staticProps: Writable<ListBoxStaticContextProps<Option>> = writable({
    selectionType,
    getLabel,
    searchable,
    disabled,
    checkEquality,
    checkIfOptionIsDisabled,
    mode,
  });
  $: staticProps.set({
    selectionType,
    getLabel,
    searchable,
    disabled,
    checkEquality,
    checkIfOptionIsDisabled,
    mode,
  });

  const state: ListBoxContextState<Option> = {
    isOpen,
    displayedOptions,
    focusedOptionIndex,
    value: valueStore,
    staticProps,
  };

  setContext<ListBoxContext<Option>>('LIST_BOX_CONTEXT', {
    api,
    state,
  });
</script>

<slot {api} isOpen={$isOpen} />
