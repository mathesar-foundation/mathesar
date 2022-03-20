<script lang="ts">
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import { getValueAfterInput } from '@mathesar-component-library-dir/common/utils';
  import type { InputFormatter, ParseResult } from './InputFormatter';

  type T = $$Generic;

  export let formatter: InputFormatter<T>;
  let parentValue: T | undefined = undefined;
  export { parentValue as value };
  export let element: HTMLInputElement | undefined = undefined;
  export let onParseError: (props: {
    userInput: string;
    error: unknown;
  }) => void = () => {};

  let childText = '';
  let parseResult: ParseResult<T> | undefined;
  let formattedValue: string | undefined;

  $: format = (v: T | undefined) =>
    v === undefined ? '' : formatter.format(v);

  function handleParentValueChange(newParentValue: T | undefined) {
    formattedValue = format(newParentValue);
    if (parseResult?.value === newParentValue) {
      return;
    }
    childText = formattedValue;
  }

  $: handleParentValueChange(parentValue);

  function handleChildValueChange(event: InputEvent) {
    event.preventDefault();
    const userInput = getValueAfterInput(event);
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
