<script lang="ts">
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { DateTimeCellProps } from '../typeDefinitions';

  import DateTimeInput from './DateTimeInput.svelte';

  type $$Props = DateTimeCellProps;

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'];
  export let setValue: (newValue: $$Props['value']) => void;
  export let disabled: $$Props['disabled'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let showTruncationPopover: $$Props['showTruncationPopover'] = false;
  export let type: $$Props['type'];
  export let formattingString: $$Props['formattingString'];
  export let formatter: $$Props['formatter'];
  export let timeShow24Hr: $$Props['timeShow24Hr'] = true;
  export let timeEnableSeconds: $$Props['timeEnableSeconds'] = true;
  export let formatForDisplay: $$Props['formatForDisplay'];
</script>

<SteppedInputCell
  {value}
  {setValue}
  {isActive}
  {disabled}
  highlightSubstringMatches={false}
  {isIndependentOfSheet}
  {showTruncationPopover}
  useTabularNumbers={true}
  let:handleInputBlur
  let:setValueInEditMode
  formatValue={formatForDisplay}
  on:movementKeyDown
  on:mouseenter
>
  <DateTimeInput
    focusOnMount={true}
    {value}
    {type}
    {formattingString}
    {formatter}
    {timeShow24Hr}
    {timeEnableSeconds}
    on:blur={handleInputBlur}
    on:artificialInput={({ detail }) => setValueInEditMode(detail)}
  />
</SteppedInputCell>
