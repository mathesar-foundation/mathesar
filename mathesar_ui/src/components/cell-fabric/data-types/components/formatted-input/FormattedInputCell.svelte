<script lang="ts">
  import { FormattedInput } from '@mathesar-component-library';

  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { FormattedInputCellProps } from '../typeDefinitions';

  type $$Props = FormattedInputCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let setValue: (newValue: $$Props['value']) => void;
  export let disabled: $$Props['disabled'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let showTruncationPopover: $$Props['showTruncationPopover'] = false;
  export let formatter: $$Props['formatter'];
  export let formatForDisplay: $$Props['formatForDisplay'];
  export let useTabularNumbers: $$Props['useTabularNumbers'] = undefined;
</script>

<SteppedInputCell
  {value}
  {setValue}
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  {showTruncationPopover}
  {useTabularNumbers}
  horizontalAlignment="right"
  let:handleInputBlur
  let:setValueInEditMode
  formatValue={formatForDisplay}
  on:movementKeyDown
  on:mouseenter
>
  <FormattedInput
    focusOnMount={true}
    {...$$restProps}
    {value}
    on:artificialInput={({ detail }) => setValueInEditMode(detail)}
    {formatter}
    on:blur={handleInputBlur}
  />
</SteppedInputCell>
