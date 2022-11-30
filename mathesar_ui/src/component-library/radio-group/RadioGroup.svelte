<script lang="ts">
  import FieldsetGroup from '@mathesar-component-library-dir/fieldset-group/FieldsetGroup.svelte';
  import Radio from '@mathesar-component-library-dir/radio/Radio.svelte';
  import type { LabelGetter } from '@mathesar-component-library-dir/common/utils/formatUtils';

  type Option = $$Generic;

  export let value: Option | undefined = undefined;
  export let isInline = false;
  export let options: Option[] = [];
  export let label: string | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let radioLabelKey: string | undefined = undefined;
  export let getRadioLabel: LabelGetter<Option> | undefined = undefined;

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
</script>

<FieldsetGroup
  {isInline}
  {options}
  {label}
  {ariaLabel}
  let:option
  let:disabled
  on:change
  labelKey={radioLabelKey}
  getLabel={getRadioLabel}
>
  <Radio
    {disabled}
    checked={valuesAreEqual(value, option)}
    on:change={({ detail: checked }) => {
      if (checked) {
        value = option;
      }
    }}
  />
  <slot slot="label" />
</FieldsetGroup>
