<script lang="ts">
  import type { InputFormatter, ParseResult } from './InputFormatter';
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';

  type T = $$Generic;

  export let formatter: InputFormatter<T>;
  let parentValue: T | undefined;
  export { parentValue as value };
  export let element: HTMLInputElement | undefined = undefined;

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

  function handleChildValueChange() {
    try {
      parseResult = formatter.parse(childText);
      parentValue = parseResult.value;
      childText = parseResult.intermediateDisplay;
    } catch (e) {
      console.log(e);
      // TODO
    }
  }

  function handleBlur() {
    childText = formattedValue ?? '';
  }
</script>

<TextInput
  bind:value={childText}
  {...$$restProps}
  bind:element
  on:input={handleChildValueChange}
  on:blur={handleBlur}
/>
