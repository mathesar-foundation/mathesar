<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';
  import { getLabel as defaultGetLabel } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import {
    ListBox,
    ListBoxOptions,
  } from '@mathesar-component-library-dir/list-box';
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';

  import type { SelectionListProps } from './SelectionListTypes';

  type Option = $$Generic;
  type $$Props = SelectionListProps<Option>;
  type DefinedProps = Required<$$Props>;

  const dispatch = createEventDispatcher<{
    change: Option | undefined;
    input: Option | undefined;
    artificialChange: Option | undefined;
    artificialInput: Option | undefined;
  }>();

  export let id: DefinedProps['id'] = getGloballyUniqueId();
  export let disabled: DefinedProps['disabled'] = false;

  /**
   * Specifies the key on which the options label is stored.
   */
  export let labelKey: DefinedProps['labelKey'] = 'label';

  export let getLabel: DefinedProps['getLabel'] = (o: Option | undefined) =>
    defaultGetLabel(o, labelKey);

  /**
   * List of options to select from. Must be an array of SelectOption.
   * @required
   */
  export let options: DefinedProps['options'];

  export let value: $$Props['value'] = undefined;

  /**
   * Classes to apply to both content and trigger.
   */
  let classes: DefinedProps['class'] = '';
  export { classes as class };

  /**
   * By default, options will be compared by equality. If you're using objects as
   * options, you can supply a custom function here to compare them.
   *
   * For example:
   *
   * ```ts
   * valuesAreEqual={(a, b) => a.id === b.id}
   * ```
   */
  export let valuesAreEqual: DefinedProps['valuesAreEqual'] = (a, b) => a === b;

  export let autoSelect: DefinedProps['autoSelect'] = 'first';

  export let offsetOnFocus: DefinedProps['offsetOnFocus'] = 0;

  function setValueFromArray(values: (Option | undefined)[]) {
    [value] = values;
    dispatch('change', value);
    dispatch('input', value);
    dispatch('artificialChange', value);
    dispatch('artificialInput', value);
  }

  function setValueOnOptionChange(opts: Option[]) {
    if (autoSelect === 'none') {
      return;
    }
    if (!opts.length) {
      if (value !== undefined) {
        setValueFromArray([]);
      }
      return;
    }
    if (
      value === undefined ||
      !opts.some((entry) => valuesAreEqual(entry, value))
    ) {
      if (autoSelect === 'first') {
        setValueFromArray(opts);
      } else if (autoSelect === 'clear') {
        setValueFromArray([]);
      }
    }
  }

  $: setValueOnOptionChange(options);

  /**
   * This type cast is essential since `ListBoxOptions` does not
   * get a direct prop with it's genertic type `Option`. The slot prop
   * `option` is identified as `unknown` instead.
   *
   * Related issues:
   * https://github.com/sveltejs/language-tools/issues/442
   * https://github.com/sveltejs/language-tools/issues/1344
   */
  function getOptionWithTypeCast(option: unknown): Option {
    return option as Option;
  }
</script>

<BaseInput {...$$restProps} {id} {disabled} />

<ListBox
  selectionType="single"
  {options}
  value={typeof value !== 'undefined' ? [value] : []}
  on:change={(e) => setValueFromArray(e.detail)}
  {labelKey}
  {getLabel}
  {disabled}
  mode="static"
  checkEquality={valuesAreEqual}
  let:api
>
  <ListBoxOptions
    {id}
    class="input-element selection-list {classes}"
    {offsetOnFocus}
    let:option
    let:label
    on:keydown={(e) => api.handleKeyDown(e)}
    on:focus
    on:blur
  >
    <slot option={getOptionWithTypeCast(option)} {label}>
      <StringOrComponent arg={getLabel(getOptionWithTypeCast(option))} />
    </slot>
  </ListBoxOptions>
</ListBox>
