<script lang="ts">
  import {
    PrecomputedMatchHighlighter,
    TextInput,
  } from '@mathesar-component-library';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { CellTypeProps } from '../typeDefinitions';
  import UriCellContent from './UriCellContent.svelte';

  type $$Props = CellTypeProps<string>;

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let searchValue: $$Props['searchValue'] = undefined;
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
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
  <span slot="content" let:matchParts>
    <CellValue {value}>
      <UriCellContent {value} {isActive}>
        {#if matchParts}
          <PrecomputedMatchHighlighter {matchParts} />
        {:else}
          {value}
        {/if}
      </UriCellContent>
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
