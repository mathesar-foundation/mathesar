<!--
  @component

  **NOTICE** This component will eventually be deleted, with its design being
  merged into `Select`.

  https://github.com/centerofci/mathesar/issues/1099
-->
<script lang="ts">
  import Select from '@mathesar-component-library-dir/select/Select.svelte';
  import type {
    SelectChangeEvent,
    SelectOption,
  } from '@mathesar-component-library-dir/select/Select.d';
  import { getLabel as defaultGetLabel } from '@mathesar-component-library-dir/common/utils/formatUtils';

  type T = $$Generic;

  export let values: T[];
  export let value: T;
  export let getLabel: (value: T) => string = defaultGetLabel;
  /**
   * By default, values will be compared by equality. If you're using objects as
   * values and you may need to supply a custom function here to compare them.
   *
   * For example:
   *
   * ```ts
   * valuesAreEqual={(a, b) => a.id === b.id}
   * ```
   */
  export let valuesAreEqual: (a: T, b: T) => boolean = (a, b) => a === b;
  export let onChange: (value: T) => void = () => {};

  $: childOptions = values.map((o) => ({ value: o, label: getLabel(o) }));

  let selectedChildOption: SelectOption<T> | undefined;

  function handleParentChange(parentValue: T) {
    if (selectedChildOption?.value === undefined) {
      return;
    }
    if (valuesAreEqual(parentValue, selectedChildOption.value)) {
      return; // to avoid infinite loop
    }
    const newOption = childOptions.find((o) =>
      valuesAreEqual(o.value, parentValue),
    );
    if (!newOption) {
      return;
    }
    // @ts-ignore because typing of Select component needs improvements
    selectedChildOption = newOption;
  }
  $: handleParentChange(value);

  function handleChildChange(event: SelectChangeEvent) {
    // @ts-ignore because typing of Select component needs improvements
    value = event.detail.value.value;
    // @ts-ignore because typing of Select component needs improvements
    selectedChildOption = event.detail.value;
    onChange(value);
  }
</script>

<Select
  options={childOptions}
  value={selectedChildOption}
  idKey="value"
  on:change={handleChildChange}
/>
