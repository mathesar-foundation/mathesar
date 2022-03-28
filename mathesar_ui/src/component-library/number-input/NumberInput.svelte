<!--
  @component

  Use this component when you want to accept user input for a regular old number
  and you don't need any high precision.

  ## Features

  - Invalid input is rejected.

  - Input is partially formatted as the user types. Grouping separators are
    automatically inserted.

  - Input is fully reformatted when focus is blurred. For example, trailing
    decimal separators are removed.

  ## Limitations

  - This component can't accept input for numbers like `99999999999999.99`
    (which becomes `99999999999999.98` as a `number`) or `9999999999999999`
    (which becomes `10000000000000000` as a `number`).  See
    `StringifiedNumberInput.svelte` for a component that will allow
    high-precision numbers by binding to a `string` instead of a `number`.

-->
<script lang="ts">
  import FormattedInput from '../formatted-input/FormattedInput.svelte';
  import type { NumberFormatterOptions } from './number-formatter/types';
  import { NumberFormatter } from './number-formatter';
  import { getInputMode } from './numberInputUtils';

  interface $$Props extends Partial<NumberFormatterOptions> {
    value?: number;
    element?: HTMLInputElement;
  }

  /**
   * See docs within `FormattedInput` for an explanation of how we're using
   * `null` vs `undefined` here.
   */
  export let value: number | null | undefined = undefined;
  export let element: HTMLInputElement | undefined = undefined;

  $: formatter = new NumberFormatter($$restProps);
  $: inputmode = getInputMode($$restProps as $$Props);
</script>

<FormattedInput
  {formatter}
  bind:value
  {...$$restProps}
  bind:element
  {inputmode}
/>
