<script lang="ts">
  import CellValue from '@mathesar/components/CellValue.svelte';
  import {
    PrecomputedMatchHighlighter,
    TextInput,
  } from '@mathesar-component-library';

  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { CellTypeProps } from '../typeDefinitions';

  import UriCellContent from './UriCellContent.svelte';

  type $$Props = CellTypeProps<string>;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let searchValue: $$Props['searchValue'] = undefined;
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let showTruncationPopover: $$Props['showTruncationPopover'] = false;
</script>

<SteppedInputCell
  bind:value
  {isActive}
  {disabled}
  {searchValue}
  {isIndependentOfSheet}
  {showTruncationPopover}
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
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
