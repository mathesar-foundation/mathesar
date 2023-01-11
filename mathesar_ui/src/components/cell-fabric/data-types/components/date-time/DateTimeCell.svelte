<script lang="ts">
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { DateTimeCellProps } from '../typeDefinitions';
  import DateTimeInput from './DateTimeInput.svelte';

  type $$Props = DateTimeCellProps;

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'];
  export let disabled: $$Props['disabled'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];

  export let type: $$Props['type'];
  export let formattingString: $$Props['formattingString'];
  export let formatter: $$Props['formatter'];
  export let timeShow24Hr: $$Props['timeShow24Hr'] = true;
  export let timeEnableSeconds: $$Props['timeEnableSeconds'] = true;
  export let formatForDisplay: $$Props['formatForDisplay'];
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
  highlightSubstringMatches={false}
  {isIndependentOfSheet}
  let:handleInputBlur
  let:handleInputKeydown
  formatValue={formatForDisplay}
  on:movementKeyDown
  on:activate
  on:mouseenter
  on:update
>
  <DateTimeInput
    focusOnMount={true}
    bind:value
    {type}
    {formattingString}
    {formatter}
    {timeShow24Hr}
    {timeEnableSeconds}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
  />
</SteppedInputCell>
