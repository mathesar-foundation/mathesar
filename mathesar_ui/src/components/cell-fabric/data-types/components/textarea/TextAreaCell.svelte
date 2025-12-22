<script lang="ts">
  import { TextArea, optionalNonNullable } from '@mathesar-component-library';
  import type { TextAreaProcessedKeyDown } from '@mathesar-component-library/types';

  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { TextAreaCellProps } from '../typeDefinitions';

  type $$Props = TextAreaCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'] = undefined;
  export let setValue: (newValue: $$Props['value']) => void;
  export let disabled: $$Props['disabled'];
  export let searchValue: $$Props['searchValue'] = undefined;
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let showTruncationPopover: $$Props['showTruncationPopover'] = false;

  // Db options
  export let length: $$Props['length'] = undefined;

  function handleKeyDown(e: TextAreaProcessedKeyDown) {
    const { type, originalEvent } = e;
    if (type === 'newlineWithEnterKeyCombination') {
      originalEvent.stopPropagation();
    }
  }
</script>

<SteppedInputCell
  {value}
  {setValue}
  {isActive}
  {disabled}
  {searchValue}
  {isIndependentOfSheet}
  {showTruncationPopover}
  multiLineTruncate={true}
  let:handleInputBlur
  let:setValueInEditMode
  on:movementKeyDown
  on:mouseenter
>
  <TextArea
    focusOnMount={true}
    maxlength={optionalNonNullable(length)}
    {disabled}
    {value}
    onValueChange={setValueInEditMode}
    on:blur={handleInputBlur}
    addNewLineOnEnterKeyCombinations={true}
    on:processedKeyDown={(e) => handleKeyDown(e.detail)}
  />
</SteppedInputCell>
