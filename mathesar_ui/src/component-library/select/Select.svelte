<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import {
    ListBox,
    ListBoxOptions,
  } from '@mathesar-component-library-dir/list-box';
  import { Dropdown } from '@mathesar-component-library-dir/dropdown';
  import { getLabel as defaultGetLabel } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';
  import StringOrComponent from '../string-or-component/StringOrComponent.svelte';
  import type { SelectProps } from './SelectTypes';

  type Option = $$Generic;
  type $$Props = SelectProps<Option>;
  type DefinedProps = Required<$$Props>;

  const dispatch = createEventDispatcher<{ change: Option | undefined }>();

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

  export let prependBlank: DefinedProps['prependBlank'] = false;

  export let value: $$Props['value'] = undefined;

  /**
   * Classes to apply to the content (each of the options).
   */
  export let contentClass: DefinedProps['contentClass'] = '';

  /**
   * Classes to apply to the trigger button (the dropdown button).
   */
  export let triggerClass: DefinedProps['triggerClass'] = '';

  /**
   * Classes to apply to both content and trigger.
   */
  let classes: DefinedProps['class'] = '';
  export { classes as class };

  /**
   * Appearance of the trigger button. One of: 'default', 'primary', 'secondary', 'plain', 'ghost'.
   */
  export let triggerAppearance: DefinedProps['triggerAppearance'] = 'default';

  /**
   * The ARIA label for this select component.
   */
  export let ariaLabel: $$Props['ariaLabel'] = undefined;

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

  function setValueFromArray(values: (Option | undefined)[]) {
    [value] = values;
    dispatch('change', value);
  }

  function setValueOnOptionChange(opts: Option[]) {
    if (opts.length > 0) {
      if (
        typeof value === 'undefined' ||
        !opts.some((entry) => valuesAreEqual(entry, value))
      ) {
        setValueFromArray(opts);
      }
    } else {
      setValueFromArray([]);
    }
  }

  $: fullOptions = prependBlank ? [undefined, ...options] : options;
  $: setValueOnOptionChange(options);
</script>

<BaseInput {...$$restProps} {id} {disabled} />

<ListBox
  selectionType="single"
  options={fullOptions}
  value={typeof value !== 'undefined' ? [value] : []}
  on:change={(e) => setValueFromArray(e.detail)}
  {labelKey}
  {getLabel}
  checkEquality={valuesAreEqual}
  let:api
  let:isOpen
>
  <Dropdown
    ariaControls="{id}-select-options"
    {ariaLabel}
    {isOpen}
    {disabled}
    {id}
    contentClass={['select', classes, contentClass].join(' ')}
    {triggerAppearance}
    triggerClass={['select full-width', classes, triggerClass].join(' ')}
    on:open={() => api.open()}
    on:close={() => api.close()}
    on:keydown={(e) => api.handleKeyDown(e)}
  >
    <svelte:fragment slot="trigger">
      <StringOrComponent arg={getLabel(value)} />
    </svelte:fragment>

    <svelte:fragment slot="content">
      <ListBoxOptions id="{id}-select-options" />
    </svelte:fragment>
  </Dropdown>
</ListBox>
