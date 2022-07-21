<script lang="ts">
  import { TextArea, optionalNonNullable } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { TextAreaCellProps } from '../typeDefinitions';

  type $$Props = TextAreaCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];

  // Db options
  export let length: $$Props['length'] = undefined;

  const addNewLineOnAllEnterKeyCombinations = true;
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
    maxlength={optionalNonNullable(length)}
    {disabled}
    bind:value
    on:blur={handleInputBlur}
    on:keydown
    {addNewLineOnAllEnterKeyCombinations}
    {handleInputKeydown}
  />
</SteppedInputCell>
