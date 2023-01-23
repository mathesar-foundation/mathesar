<script lang="ts">
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { MoneyCellProps } from '../typeDefinitions';
  import MoneyCellInput from './MoneyCellInput.svelte';

  type $$Props = MoneyCellProps;

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];
  export let searchValue: $$Props['searchValue'] = undefined;
  export let formatterOptions: $$Props['formatterOptions'];
  export let formatForDisplay: $$Props['formatForDisplay'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
  {searchValue}
  {isIndependentOfSheet}
  formatValue={formatForDisplay}
  horizontalAlignment="right"
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:mouseenter
  on:activate
  on:update
>
  <MoneyCellInput
    {disabled}
    bind:value
    {...formatterOptions}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
