<script lang="ts">
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
  export let formatForDisplay: $$Props['formatForDisplay'];
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
  {isIndependentOfSheet}
  formatValue={formatForDisplay}
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
