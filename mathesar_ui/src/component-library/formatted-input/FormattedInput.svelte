<script lang="ts">
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import { getOutcomeOfBeforeInputEvent } from '@mathesar-component-library-dir/common/utils';
  import type { InputFormatter, ParseResult } from './InputFormatter';

  type T = $$Generic;

  export let formatter: InputFormatter<T>;
  /**
   * ## `null` vs `undefined`
   *
   * - A `null` value represents input that does not contain enough information
   *   to produce a valid result, but which might occur while the user is in the
   *   process of typing a valid result (or when the user has manually cleared
   *   the contents of the input). We use `null` to represent these
   *   user-generated values because typically we want to send them to a server
   *   as `null` in JSON.
   *
   * - An `undefined` value represents a value that can only be set by the
   *   developer (to indicate that no value should be sent to the server).
   *
   * ## Changes from child
   *
   * - If the user removes all text from the input then `value` will become
   *   `null`.
   *
   * - If the user has entered _some_ input but it lacks information to produce
   *   a valid result, then `value` will be `null`. For example, in a
   *   NumberInput, we need to accept the entry "-" to allow users to enter
   *   negative numbers, but we don't yet have a number at that point.
   *
   * ## Changes from parent:
   *
   * - If you pass in an invalid string, the component will pass `null` back up
   *   to you.
   *
   * - If you pass in `undefined`, the component will retain that value until
   *   the user enters new text.
   *
   *   As soon as the user types something (even an invalid character that does
   *   not change the appearance of the input), then the user will have no way
   *   to turn `value` into `undefined` again because when they clear the
   *   contents, `value` will become `null`.
   */
  let parentValue: T | null | undefined = undefined;
  export { parentValue as value };
  export let element: HTMLInputElement | undefined = undefined;
  export let onParseError: (props: {
    userInput: string;
    error: unknown;
  }) => void = () => {};

  let childText = '';
  let parseResult: ParseResult<T> | undefined;
  let formattedValue: string | undefined;

  $: format = (v: T | null | undefined) =>
    v === undefined || v === null ? '' : formatter.format(v);

  function handleParentValueChange(newParentValue: T | null | undefined) {
    formattedValue = format(newParentValue);
    if (parseResult?.value === newParentValue) {
      return;
    }
    childText = formattedValue;
  }

  $: handleParentValueChange(parentValue);

  function handleChildValueChange(event: InputEvent) {
    event.preventDefault();
    const { value: userInput } = getOutcomeOfBeforeInputEvent(event);
    try {
      parseResult = formatter.parse(userInput);
      parentValue = parseResult.value;
      childText = parseResult.intermediateDisplay;
    } catch (error) {
      onParseError({ userInput, error });
    }
  }

  function handleBlur() {
    childText = formattedValue ?? '';
  }
</script>

<TextInput
  value={childText}
  {...$$restProps}
  bind:element
  on:beforeinput={handleChildValueChange}
  on:blur={handleBlur}
/>
