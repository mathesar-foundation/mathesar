import type { Readable } from 'svelte/store';
import type CancellablePromise from '@mathesar-component-library-dir/common/utils/CancellablePromise';

export interface ListBoxStaticContextProps<Option> {
  selectionType: 'single' | 'multiple';
  labelKey: string;
  getLabel: (value: Option, labelKey?: string) => string;
  searchable: boolean;
  disabled: boolean;
  checkEquality: (
    option: Option,
    optionToCompare: Option | undefined,
  ) => boolean;
  checkIfOptionIsDisabled: (optionToCheck: Option) => boolean;
}

export interface ListBoxProps<Option>
  extends Partial<ListBoxStaticContextProps<Option>> {
  options: Option[] | CancellablePromise<Option[]>;
  value?: Option[];
}

export interface ListBoxContextState<Option> {
  isOpen: Readable<boolean>;
  displayedOptions: Readable<Option[]>;
  focusedOptionIndex: Readable<number>;
  value: Readable<Option[]>;
  staticProps: Readable<ListBoxStaticContextProps<Option>>;
}

export interface ListBoxApi<Option> {
  open: () => void;
  close: () => void;
  toggle: () => void;
  focusOption: (option: Option) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  isOptionSelected: (option: Option) => boolean;
  select: (option: Option) => void;
  deselect: (option: Option) => void;
  selectFocused: () => void;
  handleKeyDown: (e: KeyboardEvent) => void;
}

export interface ListBoxContext<Option> {
  api: ListBoxApi<Option>;
  state: ListBoxContextState<Option>;
}
