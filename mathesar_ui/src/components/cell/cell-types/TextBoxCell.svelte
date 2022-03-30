<script lang="ts">
  import { TextInput } from '@mathesar-component-library';
  import SteppedInputCell from './common/SteppedInputCell.svelte';

  export let isActive = false;
  export let value: string | null | undefined | number = undefined;
  export let readonly = false;
  export let disabled = false;

  // Db options
  export let length: number | undefined = undefined;
</script>

<SteppedInputCell
  {value}
  {isActive}
  {readonly}
  {disabled}
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:activate
  on:update
>
  <TextInput
    focusOnMount={true}
    maxlength={length}
    {disabled}
    bind:value
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
