<script lang="ts">
  import { FormattedInput } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { DurationCellProps } from '../typeDefinitions';

  type $$Props = DurationCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];

  export let formatter: $$Props['formatter'];
</script>

<SteppedInputCell
  {value}
  {isActive}
  {disabled}
  horizontalAlignment="right"
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:activate
  on:update
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
