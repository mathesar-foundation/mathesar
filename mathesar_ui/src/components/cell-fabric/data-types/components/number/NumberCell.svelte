<script lang="ts">
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type {
    HorizontalAlignment,
    NumberCellProps,
  } from '../typeDefinitions';

  import NumberCellInput from './NumberCellInput.svelte';

  type $$Props = NumberCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];
  export let searchValue: $$Props['searchValue'] = undefined;
  export let formatterOptions: $$Props['formatterOptions'];
  export let horizontalAlignment: HorizontalAlignment = 'right';
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let showTruncationPopover: $$Props['showTruncationPopover'] = false;
  export let formatForDisplay: $$Props['formatForDisplay'];
</script>

<SteppedInputCell
  bind:value
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  {showTruncationPopover}
  {searchValue}
  useTabularNumbers={true}
  formatValue={formatForDisplay}
  {horizontalAlignment}
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:mouseenter
  on:update
>
  <NumberCellInput
    focusOnMount={true}
    {disabled}
    bind:value
    {...formatterOptions}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
