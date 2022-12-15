<script lang="ts">
  import { FormattedInput } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { FormattedInputCellProps } from '../typeDefinitions';

  type $$Props = FormattedInputCellProps;

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let formatter: $$Props['formatter'];
  export let formatForDisplay: $$Props['formatForDisplay'];
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
  {isIndependentOfSheet}
  horizontalAlignment="right"
  let:handleInputBlur
  let:handleInputKeydown
  formatValue={formatForDisplay}
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
