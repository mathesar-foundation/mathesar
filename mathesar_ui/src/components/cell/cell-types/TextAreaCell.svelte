<script lang="ts">
  import { TextArea } from '@mathesar-component-library';
  import SteppedInputCell from './common/SteppedInputCell.svelte';

  export let isActive = false;
  export let value: string | null | undefined = undefined;
  export let disabled = false;

  // Db options
  export let length: number | undefined = undefined;

  function handleKeyDown(
    e: KeyboardEvent,
    handler: (e: KeyboardEvent) => void,
  ) {
    if (e.key === 'Enter') {
      e.stopPropagation();
    } else {
      handler(e);
    }
  }
</script>

<SteppedInputCell
  {value}
  {isActive}
  {disabled}
  multiLineTruncate={true}
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:activate
  on:update
>
  <TextArea
    focusOnMount={true}
    maxlength={length}
    {disabled}
    bind:value
    on:blur={handleInputBlur}
    on:keydown={(e) => handleKeyDown(e, handleInputKeydown)}
  />
</SteppedInputCell>
