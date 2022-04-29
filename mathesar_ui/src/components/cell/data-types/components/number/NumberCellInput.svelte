<script lang="ts">
  import { StringifiedNumberInput } from '@mathesar-component-library';
  import type { StringifiedNumberInputProps } from '@mathesar-component-library/types';
  import type { NumberCellProps } from '../typeDefinitions';

  interface $$Props extends Omit<StringifiedNumberInputProps, 'value'> {
    value: NumberCellProps['value'];
    isPercentage: NumberCellProps['isPercentage'];
  }

  type ParentValue = $$Props['value'];
  type ChildValue = string | null;

  let parentValue: ParentValue = undefined;
  export { parentValue as value };

  // TODO connect this to StringifiedNumberInput
  export let isPercentage: $$Props['isPercentage'];

  let childValue: ChildValue = null;

  function getNewChildValue(newParentValue: ParentValue): ChildValue {
    if (newParentValue === undefined || newParentValue === null) {
      return null;
    }
    return String(newParentValue);
  }
  function handleParentValueChange(newParentValue: ParentValue) {
    childValue = getNewChildValue(newParentValue);
  }
  $: handleParentValueChange(parentValue);
</script>

<StringifiedNumberInput
  focusOnMount={true}
  {...$$restProps}
  value={childValue}
  on:blur
  on:keydown
  on:input={({ detail: newChildValue }) => {
    parentValue = newChildValue;
  }}
  on:input
/>
