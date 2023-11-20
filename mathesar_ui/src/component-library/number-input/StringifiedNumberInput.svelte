<!--
  @component

  Use this component when you want to accept user input for a number that might
  have too much precision to be accurately represented by a javascript `number`
  or `bigint`.

  For example, the number `99999999999999.99` can't be stored as a `bigint`
  because it's not an integer, and it can't be stored as a `number` because it
  be rounded to the nearest 64-bit floating point value of `99999999999999.98`.
  This component gracefully handles such numbers by always yielding a `value` of
  type `string` which is canonically formatted as numbers appear in JSON.

  ## Features

  - Invalid input is rejected.

  - Input is partially formatted as the user types. Grouping separators are
    automatically inserted (although only for input that can accurately be
    represented by a `number` type).

  - Input is fully reformatted when focus is blurred. For example, trailing
    decimal separators are removed.

  ## Limitations

  - You don't get a numerical value, so you can't reliably perform client-side
    numerical operations on the user input. See `NumberInput.svelte` for a
    component that will bind to a `number` instead of a `string`.
-->
<script lang="ts">
  import FormattedInput from '@mathesar-component-library-dir/formatted-input/FormattedInput.svelte';
  import { StringifiedNumberFormatter } from './number-formatter';
  import { getInputMode } from './numberInputUtils';
  import type { StringifiedNumberInputProps } from './NumberInputTypes';

  type $$Props = StringifiedNumberInputProps;

  type $$Events = FormattedInput<string>['$$events_def'];

  /**
   * When you bind to this value, you'll get a canonical stringified number, or
   * `null`.
   *
   * See docs within `FormattedInput` for an explanation of how we're using
   * `null` vs `undefined` here.
   */
  export let value: $$Props['value'] = undefined;
  export let element: $$Props['element'] = undefined;

  $: formatter = new StringifiedNumberFormatter($$restProps);
  $: inputmode = getInputMode($$restProps);

  // Flag to toggle between regular and scientific notation
  let useScientificNotation = false;

  // Event handler to toggle between scientific notation and regular notation
  function toggleScientificNotation() {
    useScientificNotation = !useScientificNotation;
    // Update the input element value accordingly
    element.value = formatInput(inputValue);
  }

  // Event handler to handle user input
  function handleInput(event) {
    const inputValue = event.target.value;
    if (isValidInput(inputValue)) {
      // Handle valid input
      element.value = formatInput(inputValue);
    } else {
      // Handle invalid input or show an error message
    }
  }

  // Format the input based on the notation mode
  function formatInput(inputValue) {
    if (useScientificNotation && isScientificNotation(inputValue)) {
      // Format as scientific notation
      return inputValue;
    } else {
      // Format as regular decimal notation
      return parseFloat(inputValue).toString();
    }
  }

  // Helper function to check for scientific notation
  function isScientificNotation(inputValue) {
    return inputValue.match(/[eE][-+]?\d+/);
  }

  // Helper function to validate input
  function isValidInput(inputValue) {
    return inputValue.match(/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/);
  }
</script>

<FormattedInput
  {...$$restProps}
  bind:value
  bind:element
  {formatter}
  {inputmode}
  on:blur
  on:focus
  on:keydown
  on:artificialInput
  on:artificialChange
  on:toggleScientificNotation
  on:input={handleInput}
/>
