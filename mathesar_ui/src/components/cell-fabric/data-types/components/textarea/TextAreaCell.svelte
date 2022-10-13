<script lang="ts">
  import { TextArea, optionalNonNullable } from '@mathesar-component-library';
  import type { TextAreaProcessedKeyDown } from '@mathesar-component-library/types';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { TextAreaCellProps } from '../typeDefinitions';

  type $$Props = TextAreaCellProps;

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];

  // Db options
  export let length: $$Props['length'] = undefined;
<<<<<<< HEAD
  let datafromdbcopyhelper = false;
  let datafromdb = '';
=======

>>>>>>> b0fc2467ea965f9258fe0fa5e103c18317af4c43
  function handleKeyDown(
    e: TextAreaProcessedKeyDown,
    handler: (e: KeyboardEvent) => void,
  ) {
<<<<<<< HEAD
    datafromdb = datafromdbcopyhelper === false && value !== undefined && value !== null  ? value : datafromdb;
    datafromdbcopyhelper = true;
    if (e.originalEvent.key === 'Escape') {
      value = datafromdb;
    }
    if (e.originalEvent.key === 'Enter') {
      datafromdb = value !== undefined  && value !== null ? value : '';
    }
=======
>>>>>>> b0fc2467ea965f9258fe0fa5e103c18317af4c43
    const { type, originalEvent } = e;
    if (type === 'newlineWithEnterKeyCombination') {
      originalEvent.stopPropagation();
    } else {
      handler(originalEvent);
    }
  }
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
  multiLineTruncate={true}
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:activate
  on:mouseenter
  on:update
>
  <TextArea
    focusOnMount={true}
    maxlength={optionalNonNullable(length)}
    {disabled}
    bind:value
    on:blur={handleInputBlur}
    addNewLineOnEnterKeyCombinations={true}
    on:processedKeyDown={(e) => handleKeyDown(e.detail, handleInputKeydown)}
  />
</SteppedInputCell>
