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
  export let setValue: (newValue: $$Props['value']) => void;
  export let disabled: $$Props['disabled'];
  export let searchValue: $$Props['searchValue'] = undefined;
  export let formatterOptions: $$Props['formatterOptions'];
  export let horizontalAlignment: HorizontalAlignment = 'right';
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let showTruncationPopover: $$Props['showTruncationPopover'] = false;
  export let formatForDisplay: $$Props['formatForDisplay'];
</script>

<SteppedInputCell
  {value}
  {setValue}
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  {showTruncationPopover}
  {searchValue}
  useTabularNumbers={true}
  formatValue={formatForDisplay}
  {horizontalAlignment}
  let:handleInputBlur
  let:setValueInEditMode
  on:movementKeyDown
  on:mouseenter
>
  <NumberCellInput
    focusOnMount={true}
    {disabled}
    {value}
    {...formatterOptions}
    on:blur={handleInputBlur}
    on:artificialInput={({ detail }) => setValueInEditMode(detail)}
  />
</SteppedInputCell>
