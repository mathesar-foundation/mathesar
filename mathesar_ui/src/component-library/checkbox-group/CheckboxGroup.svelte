<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import type { LabelGetter } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import FieldsetGroup from '@mathesar-component-library-dir/fieldset-group/FieldsetGroup.svelte';
  import type { ComponentWithProps } from '../types';

  type Option = $$Generic;

  export let values: Option[] = [];
  export let isInline = false;
  export let options: readonly Option[] = [];
  export let label: string | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let checkboxLabelKey: string | undefined = undefined;
  export let getCheckboxLabel: LabelGetter<Option> | undefined = undefined;
  export let getCheckboxHelp: <C extends SvelteComponent>(
    value: Option,
  ) => string | ComponentWithProps<C> | undefined = () => undefined;
  export let getCheckboxDisabled: (value: Option | undefined) => boolean = () =>
    false;
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

  export let disabled = false;

  function handleChange(option: Option, checked: boolean) {
    if (checked) {
      values = [...values, option];
    } else {
      values = values.filter((value) => !valuesAreEqual(value, option));
    }
  }
</script>

<FieldsetGroup
  {isInline}
  {options}
  {label}
  {ariaLabel}
  {disabled}
  let:option
  let:disabled={innerDisabled}
  on:change
  labelKey={checkboxLabelKey}
  getLabel={getCheckboxLabel}
  getHelp={getCheckboxHelp}
  getDisabled={getCheckboxDisabled}
>
  <Checkbox
    on:change={({ detail: checked }) => handleChange(option, checked)}
    checked={values.some((o) => valuesAreEqual(o, option))}
    disabled={innerDisabled}
  />
  <slot slot="label" />
</FieldsetGroup>
