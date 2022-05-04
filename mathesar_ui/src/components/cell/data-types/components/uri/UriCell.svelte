<script lang="ts">
  import { TextInput } from '@mathesar-component-library';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { TextBoxCellProps } from '../typeDefinitions';

  type $$Props = TextBoxCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
</script>

<SteppedInputCell
  {value}
  {isActive}
  {disabled}
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:activate
  on:update
>
  <span slot="content">
    <CellValue {value}>
      <a href={value} target="_blank" class="link">{value}</a>
    </CellValue>
  </span>
  <TextInput
    focusOnMount={true}
    {disabled}
    bind:value
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>

<style>
  .link {
    color: #3867ad;
  }
  .link:visited {
    color: #6138ad;
  }
</style>
