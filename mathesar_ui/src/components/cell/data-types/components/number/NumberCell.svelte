<script lang="ts">
  import {
    StringifiedNumberFormatter,
    isDefinedNonNullable,
  } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { NumberCellProps } from '../typeDefinitions';
  import NumberCellInput from './NumberCellInput.svelte';

  type $$Props = NumberCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];

  export let locale: $$Props['locale'];
  export let allowFloat: $$Props['allowFloat'];

  $: formatterOptions = {
    locale,
    allowFloat,
    allowNegative: true,
  };
  $: formatter = new StringifiedNumberFormatter(formatterOptions);

  function formatValue(
    v: string | number | null | undefined,
  ): string | null | undefined {
    if (!isDefinedNonNullable(v)) {
      return v;
    }
    return formatter.format(String(v));
  }
</script>

<SteppedInputCell
  {value}
  {isActive}
  {disabled}
  {formatValue}
  horizontalAlignment="right"
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:activate
  on:update
>
  <NumberCellInput
    {disabled}
    bind:value
    {...formatterOptions}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
