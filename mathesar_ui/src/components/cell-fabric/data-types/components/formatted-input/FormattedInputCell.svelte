<script lang="ts">
  import {
    FormattedInput,
    isDefinedNonNullable,
  } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { FormattedInputCellProps } from '../typeDefinitions';

  type $$Props = FormattedInputCellProps;

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];

  export let formatter: $$Props['formatter'];

  function formatValue(
    v: string | null | undefined,
  ): string | null | undefined {
    if (!isDefinedNonNullable(v)) {
      return v;
    }
    return formatter.format(v);
  }
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
  horizontalAlignment="right"
  let:handleInputBlur
  let:handleInputKeydown
  {formatValue}
  on:movementKeyDown
  on:activate
  on:mouseenter
  on:update
>
  <FormattedInput
    focusOnMount={true}
    {...$$restProps}
    bind:value
    {formatter}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
    --input-element-text-align="right"
  />
</SteppedInputCell>
