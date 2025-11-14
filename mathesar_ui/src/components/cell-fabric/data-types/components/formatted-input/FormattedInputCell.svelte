<script lang="ts">
  import { FormattedInput } from '@mathesar-component-library';

  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { FormattedInputCellProps } from '../typeDefinitions';

  type $$Props = FormattedInputCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];
  export let isEditMode = false;
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let showTruncationPopover: $$Props['showTruncationPopover'] = false;
  export let formatter: $$Props['formatter'];
  export let formatForDisplay: $$Props['formatForDisplay'];
  export let useTabularNumbers: $$Props['useTabularNumbers'] = undefined;
</script>

<SteppedInputCell
  bind:value
  {isActive}
  {isEditMode}
  {disabled}
  {isIndependentOfSheet}
  {showTruncationPopover}
  {useTabularNumbers}
  horizontalAlignment="right"
  let:handleInputBlur
  let:handleInputKeydown
  formatValue={formatForDisplay}
  on:movementKeyDown
  on:mouseenter
  on:update
  on:enterEditMode
  on:exitEditMode
>
  <FormattedInput
    focusOnMount={true}
    {...$$restProps}
    bind:value
    {formatter}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
