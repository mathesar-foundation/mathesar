<script lang="ts">
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import type { TextAreaProps } from '@mathesar-component-library-dir/text-area/TextAreaTypes';

  type $$Props = TextAreaProps;

  let textareaRef: HTMLTextAreaElement;

  // Id for the input
  export let id: string | undefined = undefined;

  // Disable input
  export let disabled = false;

  let classes = '';
  export { classes as class };

  export let addNewLineOnAllEnterKeyCombinations = false;

  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value: string | undefined | null = '';

  export let element: $$Props['element'] = undefined;

  export let hasError = false;

  export function handleInputKeydown(e: KeyboardEvent) {}

  function handleKeyDown(
    e: KeyboardEvent,
    handler: (e: KeyboardEvent) => void,
  ) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      if (addNewLineOnAllEnterKeyCombinations) {
        let pos = textareaRef.selectionStart;
        const front = textareaRef.value.substring(0, pos);
        const back = textareaRef.value.substring(pos, textareaRef.value.length);
        textareaRef.value = `${front}\n${back}`;
        value = textareaRef.value;
        pos += 1;
        textareaRef.selectionStart = pos;
        textareaRef.selectionEnd = pos;
        e.stopPropagation();
      }
    } else {
      handler(e);
    }
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
  bind:this={textareaRef}
  bind:value
  on:input
  on:focus
  on:blur
  on:keydown={(e) => handleKeyDown(e, handleInputKeydown)}
/>
