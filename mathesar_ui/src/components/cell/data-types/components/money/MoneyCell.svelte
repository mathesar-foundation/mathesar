<script lang="ts">
  import {
    StringifiedNumberFormatter,
    isDefinedNonNullable,
  } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { MoneyCellProps } from '../typeDefinitions';
  import MoneyCellInput from './MoneyCellInput.svelte';

  type $$Props = MoneyCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];

  export let locale: $$Props['locale'];
  export let currencySymbol: $$Props['currencySymbol'];
  export let currencySymbolLocation: $$Props['currencySymbolLocation'];
  export let allowFloat: $$Props['allowFloat'];

  $: formatterOptions = {
    locale,
    allowFloat,
    allowNegative: true,
  };
  $: formatter = new StringifiedNumberFormatter(formatterOptions);

  $: insertCurrencySymbol = (() => {
    switch (currencySymbolLocation) {
      case 'after-minus':
        return (s: string) => s.replace(/^(-?)/, `$1${currencySymbol}`);
      case 'end-with-space':
        return (s: string) => `${s} ${currencySymbol}`;
      default:
        return (s: string) => s;
    }
  })();

  function formatValue(
    v: string | number | null | undefined,
  ): string | null | undefined {
    if (!isDefinedNonNullable(v)) {
      return v;
    }
    return insertCurrencySymbol(formatter.format(String(v)));
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
  <MoneyCellInput
    {disabled}
    bind:value
    {...formatterOptions}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
