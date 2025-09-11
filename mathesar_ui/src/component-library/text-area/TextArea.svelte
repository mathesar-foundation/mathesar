<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import type { LabelController } from '@mathesar-component-library-dir/label';
  import type {
    TextAreaProcessedKeyDown,
    TextAreaProps,
  } from '@mathesar-component-library-dir/text-area/TextAreaTypes';

  const dispatch = createEventDispatcher<{
    processedKeyDown: TextAreaProcessedKeyDown;
  }>();

  type $$Props = TextAreaProps;

  export let id: string | undefined = undefined;

  export let disabled = false;

  let classes: string | null = '';
  export { classes as class };

  export let addNewLineOnEnterKeyCombinations = false;

  export let value: string | undefined | null = undefined;

  export let element: $$Props['element'] = undefined;

  export let hasError = false;

  export let labelController: LabelController | undefined = undefined;

  export let focusOnMount: boolean | undefined = undefined;

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

<BaseInput bind:id {labelController} {disabled} {focusOnMount} />

<textarea
  bind:this={element}
  {...$$restProps}
  class="input-element text-area {classes ?? ''}"
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
