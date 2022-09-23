<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import type {
    TextAreaProps,
    TextAreaProcessedKeyDown,
  } from '@mathesar-component-library-dir/text-area/TextAreaTypes';

  const dispatch = createEventDispatcher<{
    processedKeyDown: TextAreaProcessedKeyDown;
  }>();

  type $$Props = TextAreaProps;

  // Id for the input
  export let id: string | undefined = undefined;

  // Disable input
  export let disabled = false;

  let classes = '';
  export { classes as class };

  export let addNewLineOnEnterKeyCombinations = false;

  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value: string | undefined | null = '';

  export let element: $$Props['element'] = undefined;

  export let hasError = false;

  function handleKeyDown(e: KeyboardEvent) {
    let type: TextAreaProcessedKeyDown['type'] = 'normal';
    if (
      element &&
      e.key === 'Enter' &&
      (e.ctrlKey || e.metaKey || e.shiftKey)
    ) {
      if (addNewLineOnEnterKeyCombinations && !e.shiftKey) {
        let pos = element.selectionStart;
        const front = element.value.substring(0, pos);
        const back = element.value.substring(pos, element.value.length);
        element.value = `${front}\n${back}`;
        value = element.value;
        pos += 1;
        element.selectionStart = pos;
        element.selectionEnd = pos;
      }
      type = 'newlineWithEnterKeyCombination';
    }
    dispatch('processedKeyDown', {
      type,
      originalEvent: e,
    });
  }
</script>

<BaseInput {...$$restProps} bind:id {disabled} />

<textarea
  bind:this={element}
  {...$$restProps}
  class="input-element text-area {classes}"
  class:has-error={hasError}
  {id}
  {disabled}
  bind:value
  on:input
  on:change
  on:focus
  on:blur
  on:keydown={handleKeyDown}
  on:keydown
/>
