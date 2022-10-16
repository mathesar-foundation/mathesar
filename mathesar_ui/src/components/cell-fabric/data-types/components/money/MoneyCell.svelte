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
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];
  export let currencySymbol: $$Props['currencySymbol'];
  export let currencySymbolLocation: $$Props['currencySymbolLocation'];
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
    return insertCurrencySymbol(displayFormatter.format(String(v)));
  }
  let datafromdbcopyhelper = false;
  let datafromdb: number;
  function Escbehave(e: KeyboardEvent) {
    datafromdb =
      datafromdbcopyhelper === false && value !== undefined
        ? Number(value)
        : datafromdb;
    datafromdbcopyhelper = true;
    if (e.key === 'Escape') {
      value = datafromdb;
    }
    if (e.key === 'Enter') {
      datafromdb = value !== undefined ? Number(value) : 0;
    }
  }
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
  {formatValue}
  horizontalAlignment="right"
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:mouseenter
  on:activate
  on:update
>
  <MoneyCellInput
    {disabled}
    bind:value
    {...formatterOptions}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
    on:keydown={(e) => {
      Escbehave(e);
    }}
  />
</SteppedInputCell>
