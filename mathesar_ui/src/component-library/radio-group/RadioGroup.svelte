<script lang="ts">
  import type { LabelGetter } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import FieldsetGroup from '@mathesar-component-library-dir/fieldset-group/FieldsetGroup.svelte';
  import Radio from '@mathesar-component-library-dir/radio/Radio.svelte';

  type Option = $$Generic;

  export let value: Option | undefined = undefined;
  export let isInline = false;
  export let options: readonly Option[] = [];
  export let label: string | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let radioLabelKey: string | undefined = undefined;
  export let getRadioLabel: LabelGetter<Option> | undefined = undefined;
  export let disabled = false;
  export let boxed = false;

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
  {ariaLabel}
  {disabled}
  {boxed}
  let:option
  let:disabled={innerDisabled}
  on:change
  labelKey={radioLabelKey}
  getLabel={getRadioLabel}
>
  <Radio
    disabled={innerDisabled}
    checked={valuesAreEqual(value, option)}
    on:change={({ detail: checked }) => {
      if (checked) {
        value = option;
      }
    }}
  />
  <slot slot="label" name="label">{label}</slot>
  <slot slot="extra" name="extra" />
</FieldsetGroup>
