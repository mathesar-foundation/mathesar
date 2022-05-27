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
  export let useGrouping: $$Props['useGrouping'];
  export let minimumFractionDigits: $$Props['minimumFractionDigits'];
  export let maximumFractionDigits: $$Props['maximumFractionDigits'];
  export let locale: $$Props['locale'];
  export let allowFloat: $$Props['allowFloat'];

  $: formatterOptions = {
    locale,
    allowFloat,
    allowNegative: true,
    useGrouping,
    minimumFractionDigits,
  };
  /** Used only for display -- not during input */
  $: displayFormatter = new StringifiedNumberFormatter({
    ...formatterOptions,
    // We only want to apply `maximumFractionDigits` during display. We don't
    // want it to take effect during input.
    maximumFractionDigits,
  });

  function formatValue(
    v: string | number | null | undefined,
  ): string | null | undefined {
    if (!isDefinedNonNullable(v)) {
      return v;
    }
    return displayFormatter.format(String(v));
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
