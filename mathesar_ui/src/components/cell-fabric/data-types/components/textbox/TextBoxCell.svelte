<script lang="ts">
  import { TextInput, optionalNonNullable } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { TextBoxCellProps } from '../typeDefinitions';

  type $$Props = TextBoxCellProps;

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let searchValue: $$Props['searchValue'] = undefined;
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];

  // Db options
  export let length: $$Props['length'] = undefined;
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
  {searchValue}
  {isIndependentOfSheet}
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:activate
  on:mouseenter
  on:update
>
  <TextInput
    focusOnMount={true}
    maxlength={optionalNonNullable(length)}
    {disabled}
    bind:value
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
