<script lang="ts">
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { MoneyCellProps } from '../typeDefinitions';

  import MoneyCellInput from './MoneyCellInput.svelte';

  type $$Props = MoneyCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let setValue: (newValue: $$Props['value']) => void;
  export let disabled: $$Props['disabled'];
  export let searchValue: $$Props['searchValue'] = undefined;
  export let formatterOptions: $$Props['formatterOptions'];
  export let formatForDisplay: $$Props['formatForDisplay'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let showTruncationPopover: $$Props['showTruncationPopover'] = false;
</script>

<SteppedInputCell
  {value}
  {setValue}
  {isActive}
  {disabled}
  {searchValue}
  {isIndependentOfSheet}
  {showTruncationPopover}
  useTabularNumbers={true}
  formatValue={formatForDisplay}
  horizontalAlignment="right"
  let:handleInputBlur
  let:setValueInEditMode
  on:movementKeyDown
  on:mouseenter
>
  <MoneyCellInput
    focusOnMount={true}
    {disabled}
    {value}
    {...formatterOptions}
    on:blur={handleInputBlur}
    on:artificialInput={({ detail }) => setValueInEditMode(detail)}
  />
</SteppedInputCell>
