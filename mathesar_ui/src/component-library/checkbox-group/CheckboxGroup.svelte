<script lang="ts">
  import FieldsetGroup from '@mathesar-component-library-dir/fieldset-group/FieldsetGroup.svelte';
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import type { LabelGetter } from '@mathesar-component-library-dir/common/utils/formatUtils';

  type Option = $$Generic;

  export let values: Option[] = [];
  export let isInline = false;
  export let options: Option[] = [];
  export let label: string | undefined = undefined;
  export let checkboxLabelKey: string | undefined = undefined;
  export let getCheckboxLabel: LabelGetter<Option> | undefined = undefined;
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
  let:option
  let:disabled
  on:change
  labelKey={checkboxLabelKey}
  getLabel={getCheckboxLabel}
>
  <Checkbox
    on:change={({ detail: checked }) => handleChange(option, checked)}
    checked={values.some((o) => valuesAreEqual(o, option))}
    {disabled}
  />
  <slot slot="label" />
</FieldsetGroup>
