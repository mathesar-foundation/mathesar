<script lang="ts">
  import { isDefinedNonNullable } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { DateTimeCellProps } from '../typeDefinitions';
  import DateTimeInput from './DateTimeInput.svelte';

  type $$Props = DateTimeCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];

  export let type: $$Props['type'];
  export let formattingString: $$Props['formattingString'];
  export let formatter: $$Props['formatter'];
  export let timeShow24Hr: $$Props['timeShow24Hr'] = true;
  export let timeEnableSeconds: $$Props['timeEnableSeconds'] = true;

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
    {type}
    {formattingString}
    {formatter}
    {timeShow24Hr}
    {timeEnableSeconds}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
