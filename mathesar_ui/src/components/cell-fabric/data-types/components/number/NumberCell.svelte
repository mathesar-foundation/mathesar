<script lang="ts">
  import { isDefinedNonNullable } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type {
    HorizontalAlignment,
    NumberCellProps,
  } from '../typeDefinitions';
  import NumberCellInput from './NumberCellInput.svelte';

  type $$Props = NumberCellProps;

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];
  export let formatterOptions: $$Props['formatterOptions'];
  export let horizontalAlignment: HorizontalAlignment = 'right';
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let displayFormatter: $$Props['displayFormatter'];

  function formatValue(
    v: string | number | null | undefined,
  ): string | null | undefined {
    if (!isDefinedNonNullable(v)) {
      return v;
    }
    return displayFormatter.format(String(v));
  }
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
  {isIndependentOfSheet}
  {formatValue}
  {horizontalAlignment}
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:activate
  on:mouseenter
  on:update
>
  <NumberCellInput
    {disabled}
    bind:value
    {...formatterOptions}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
