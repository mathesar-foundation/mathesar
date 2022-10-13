<script lang="ts">
  import { TextInput, optionalNonNullable } from '@mathesar-component-library';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { TextBoxCellProps } from '../typeDefinitions';

  type $$Props = TextBoxCellProps;

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];

  // Db options
  export let length: $$Props['length'] = undefined;
<<<<<<< HEAD

  let datafromdbcopyhelper = false;
  let datafromdb: string;
  const Escbehave = (e: KeyboardEvent) => {
    datafromdb =
      datafromdbcopyhelper === false && value !== undefined ? value : datafromdb;
    datafromdbcopyhelper = true;
    if (e.key === 'Escape') {
      value = datafromdb;
    }
    if (e.key === 'Enter') {
      datafromdb = value !== undefined ? value : '';
    }
  };
=======
>>>>>>> b0fc2467ea965f9258fe0fa5e103c18317af4c43
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
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
<<<<<<< HEAD
    on:keydown={(e) => {
      Escbehave(e);
    }}
=======
>>>>>>> b0fc2467ea965f9258fe0fa5e103c18317af4c43
  />
</SteppedInputCell>
