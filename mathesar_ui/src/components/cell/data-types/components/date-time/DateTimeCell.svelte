<script lang="ts">
  import { isDefinedNonNullable } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { DateCellProps } from '../typeDefinitions';
  import DateTimeInput from './DateTimeInput.svelte';

  type $$Props = DateCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];

  export let dateFormattingString: $$Props['dateFormattingString'];
  export let formatter: $$Props['formatter'];

  function formatValue(
    v: string | null | undefined,
  ): string | null | undefined {
    if (!isDefinedNonNullable(v)) {
      return v;
    }
    return formatter.parseAndFormat(v);
  }
</script>

<SteppedInputCell
  {value}
  {isActive}
  {disabled}
  let:handleInputBlur
  let:handleInputKeydown
  {formatValue}
  on:movementKeyDown
  on:activate
  on:update
>
  <DateTimeInput
    bind:value
    {dateFormattingString}
    {formatter}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
