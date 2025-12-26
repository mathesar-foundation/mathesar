<script lang="ts">
  import FormattedInput from '@mathesar/component-library/formatted-input/FormattedInput.svelte';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import { PrecomputedMatchHighlighter } from '@mathesar-component-library';

  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { FormattedInputCellProps } from '../typeDefinitions';

  import UriCellContent from './UriCellContent.svelte';

  type $$Props = FormattedInputCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'] = undefined;
  export let setValue: (newValue: $$Props['value']) => void;
  export let disabled: $$Props['disabled'];
  export let searchValue: $$Props['searchValue'] = undefined;
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let showTruncationPopover: $$Props['showTruncationPopover'] = false;
  export let formatter: $$Props['formatter'];
  export let formatForDisplay: $$Props['formatForDisplay'];
</script>

<SteppedInputCell
  {value}
  {setValue}
  {isActive}
  {disabled}
  {searchValue}
  {isIndependentOfSheet}
  {showTruncationPopover}
  let:handleInputBlur
  let:setValueInEditMode
  formatValue={formatForDisplay}
  on:movementKeyDown
  on:mouseenter
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
  <FormattedInput
    focusOnMount={true}
    {...$$restProps}
    {disabled}
    {value}
    on:artificialInput={({ detail }) => setValueInEditMode(detail)}
    {formatter}
    on:blur={handleInputBlur}
  />
</SteppedInputCell>
