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
  export let searchValue: $$Props['searchValue'] = undefined;
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];

  // Db options
  export let length: $$Props['length'] = undefined;

  function handleKeyDown(
    e: TextAreaProcessedKeyDown,
    handler: (e: KeyboardEvent) => void,
  ) {
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
  {searchValue}
  {isIndependentOfSheet}
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
