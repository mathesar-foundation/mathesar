<script lang="ts">
  import { FormattedInput } from '@mathesar-component-library';

  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { FormattedInputCellProps } from '../typeDefinitions';

  type $$Props = FormattedInputCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let showTruncationPopover: $$Props['showTruncationPopover'] = false;
  export let formatter: $$Props['formatter'];
  export let formatForDisplay: $$Props['formatForDisplay'];
  export let useTabularNumbers: $$Props['useTabularNumbers'] = undefined;

  $: cssVariables = {
    '--input-element-text-align': 'right',
    ...($$restProps.cssVariables || {}),
  };
</script>

<SteppedInputCell
  bind:value
  {isActive}
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
>
  <FormattedInput
    focusOnMount={true}
    {...$$restProps}
    bind:value
    {formatter}
    {cssVariables}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
