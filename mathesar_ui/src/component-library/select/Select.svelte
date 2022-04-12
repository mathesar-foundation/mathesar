<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import {
    ListBox,
    ListBoxOptions,
  } from '@mathesar-component-library-dir/listbox';
  import { Dropdown } from '@mathesar-component-library-dir/dropdown';
  import { getLabel as defaultGetLabel } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import type { Appearance } from '@mathesar-component-library-dir/types';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';

  type Option = $$Generic;

  const dispatch = createEventDispatcher<{ change: Option | undefined }>();

  export let id = getGloballyUniqueId();

  export let disabled = false;

  /**
   * Specifies the key on which the options label is stored.
   */
  export let labelKey = 'label';

  /**
   * List of options to select from. Must be an array of SelectOption.
   * @required
   */
  export let options: Option[] = [];

  export let value: Option | undefined = undefined;

  /**
   * Classes to apply to the content (each of the options).
   */
  export let contentClass = '';

  /**
   * Classes to apply to the trigger button (the dropdown button).
   */
  export let triggerClass = '';

  /**
   * Appearance of the trigger button. One of: 'default', 'primary', 'secondary', 'plain', 'ghost'.
   */
  export let triggerAppearance: Appearance = 'default';

  /**
   * The ARIA label for this select component.
   */
  export let ariaLabel: string | undefined = undefined;

  export let getLabel: (value: Option, labelKey?: string) => string =
    defaultGetLabel;

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
  export let valuesAreEqual: (
    optionToCompare: Option,
    selectedOption: Option | undefined,
  ) => boolean = (a, b) => a === b;

  function setValueFromArray(values: Option[]) {
    [value] = values;
    dispatch('change', value);
  }

  function setValueOnOptionChange(opts: Option[]) {
    if (opts.length > 0) {
      if (!value || !opts.some((entry) => valuesAreEqual(entry, value))) {
        setValueFromArray(opts);
      }
    } else {
      setValueFromArray([]);
    }
  }

  $: setValueOnOptionChange(options);
</script>

<BaseInput {...$$restProps} {id} {disabled} />

<ListBox
  selectionType="single"
  {options}
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
    contentClass="select {contentClass}"
    {triggerAppearance}
    {triggerClass}
    on:open={() => api.open()}
    on:close={() => api.close()}
    on:keydown={(e) => api.handleKeyDown(e)}
    on:blur={() => api.close()}
  >
    <svelte:fragment slot="trigger">
      {#if typeof value !== 'undefined'}
        {getLabel(value, labelKey)}
      {:else}
        No option selected
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="content">
      <ListBoxOptions id="{id}-select-options" />
    </svelte:fragment>
  </Dropdown>
</ListBox>
