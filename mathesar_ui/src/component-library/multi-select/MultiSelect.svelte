<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { faBackspace, faTimes } from '@fortawesome/free-solid-svg-icons';
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';
  import type { LabelGetter } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import { getLabel as defaultGetLabel } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import { AttachableDropdown } from '@mathesar-component-library-dir/dropdown';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import {
    ListBox,
    ListBoxOptions,
  } from '@mathesar-component-library-dir/list-box';
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';

  type Option = $$Generic;

  const dispatch = createEventDispatcher<{ change: Option[] }>();

  export let id = getGloballyUniqueId();

  export let disabled = false;

  /**
   * Specifies the key on which the options label is stored.
   */
  export let labelKey = 'label';

  export let getLabel: LabelGetter<Option> = (o: Option) =>
    defaultGetLabel(o, labelKey);

  /**
   * List of options to select from.
   */
  export let options: Option[] = [];

  export let values: Option[] = [];

  /**
   * Classes to apply to the content (each of the options).
   */
  export let contentClass = '';

  /**
   * Classes to apply to the trigger button (the dropdown button).
   */
  export let triggerClass = '';

  /**
   * The ARIA label for this select component.
   */
  export let ariaLabel: string | undefined = undefined;

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
    optionToCompare: Option | undefined,
    selectedOption: Option | undefined,
  ) => boolean = (a, b) => a === b;

  let trigger: HTMLElement;

  function setValues(newValues: Option[]) {
    values = newValues;
    dispatch('change', values);
  }

  function removeValue(value: Option) {
    setValues(values.filter((v) => !valuesAreEqual(v, value)));
  }

  function handleOptionsChange(newOptions: Option[]) {
    setValues(
      values.filter((v) => newOptions.some((o) => valuesAreEqual(o, v))),
    );
  }
  $: handleOptionsChange(options);
</script>

<BaseInput {...$$restProps} {id} {disabled} />

<ListBox
  {options}
  bind:value={values}
  on:change
  {labelKey}
  {getLabel}
  checkEquality={valuesAreEqual}
  let:api
  let:isOpen
>
  <span
    class="input-element multi-select-trigger {triggerClass}"
    bind:this={trigger}
    on:click={api.toggle}
    aria-label={ariaLabel}
    tabindex="0"
    on:keydown={api.handleKeyDown}
  >
    <span class="selected-values">
      {#each values as value}
        <span class="selected-value">
          <span class="label">
            <StringOrComponent arg={getLabel(value)} />
          </span>
          <span
            class="remove-button icon-button"
            on:click|stopPropagation={() => removeValue(value)}
          >
            <Icon data={faTimes} size="0.8em" />
          </span>
        </span>
      {/each}
    </span>
    <span
      class="clear-button icon-button"
      on:click|stopPropagation={() => setValues([])}
    >
      <Icon data={faBackspace} />
    </span>
  </span>

  <AttachableDropdown
    {isOpen}
    class="multi-select-content {contentClass}"
    {trigger}
    on:close={() => api.close()}
  >
    <ListBoxOptions id="{id}-select-options" />
  </AttachableDropdown>
</ListBox>
