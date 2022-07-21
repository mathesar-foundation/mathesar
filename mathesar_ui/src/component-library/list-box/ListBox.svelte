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
  type DefinedProps = Required<$$Props>;

  interface $$Slots {
    default: {
      api: ListBoxApi<Option>;
      isOpen: boolean;
    };
  }

  const dispatch = createEventDispatcher<{ change: DefinedProps['value'] }>();

  export let selectionType: DefinedProps['selectionType'] = 'multiple';
  export let options: DefinedProps['options'];
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

  const isOpen = writable(false);
  const focusedOptionIndex = writable(-1);

  /**
   * We have displayedOptions in order to be used:
   * - when options is passed as a promise,
   * - while searching through option list.
   */
  const displayedOptions = writable(Array.isArray(options) ? options : []);
  $: displayedOptions.set(Array.isArray(options) ? options : []);

  function focusSelected(): void {
    const lastSelectedOption = value[value.length - 1];
    if (typeof lastSelectedOption !== 'undefined') {
      $focusedOptionIndex = $displayedOptions.findIndex((opt) =>
        checkEquality(lastSelectedOption, opt),
      );
    } else {
      $focusedOptionIndex = -1;
    }
  }

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
    if ($isOpen) {
      close();
    } else {
      open();
    }
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
      $focusedOptionIndex <= 0
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
      if (selectionType === 'single') {
        close();
      }
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

  function pick(option: Option): void {
    if (selectionType === 'single') {
      select(option);
      return;
    }
    if (isOptionSelected(option)) {
      deselect(option);
    } else {
      select(option);
    }
  }

  function pickFocused(): void {
    const focusedOption = $displayedOptions[$focusedOptionIndex];
    if (typeof focusedOption !== 'undefined') {
      pick(focusedOption);
    } else if (selectionType === 'single') {
      close();
    }
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if ($isOpen) {
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
        default:
          break;
      }
    } else {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          open();
          break;
        default:
          break;
      }
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

  // We need the following stores to not have undefined values. We need to
  // update them when props change. The stores cannot be recreated, since we
  // need to set them in context. The only way so far do that is to create a
  // writable with the props, and then a reactive statement which updates the
  // store when those props change.
  //
  // TODO: Check if we can do this in a better manner.

  const valueStore = writable(value);
  $: valueStore.set(value);

  const staticProps: Writable<ListBoxStaticContextProps<Option>> = writable({
    selectionType,
    getLabel,
    searchable,
    disabled,
    checkEquality,
    checkIfOptionIsDisabled,
  });
  $: staticProps.set({
    selectionType,
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

  setContext<ListBoxContext<Option>>('LIST_BOX_CONTEXT', {
    api,
    state,
  });
</script>

<slot {api} isOpen={$isOpen} />
