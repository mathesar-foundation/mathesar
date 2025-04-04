<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import {
    AttachableDropdown,
    FormattedInput,
    InlineDateTimePicker,
    dayjs,
    isDefinedNonNullable,
  } from '@mathesar-component-library';
  import type { FormattedInputProps } from '@mathesar-component-library/types';

  import type {
    DateTimeCellExternalProps,
    DateTimeCellProps,
  } from '../typeDefinitions';

  import Presets from './Presets.svelte';

  const dispatch = createEventDispatcher();

  type $$Props = FormattedInputProps<string> &
    Omit<DateTimeCellExternalProps, 'formatForDisplay'> & {
      value: DateTimeCellProps['value'];
    };

  export let type: $$Props['type'];
  export let formattingString: $$Props['formattingString'];
  export let formatter: $$Props['formatter'];

  export let value: $$Props['value'];
  export let timeShow24Hr: $$Props['timeShow24Hr'] = true;
  export let timeEnableSeconds: $$Props['timeEnableSeconds'] = true;

  export let allowRelativePresets: $$Props['allowRelativePresets'] = false;

  let element: HTMLInputElement;
  let isOpen = false;

  function getDatePickerValue(_value: $$Props['value']): string | undefined {
    if (isDefinedNonNullable(_value)) {
      const parsedAndFormatted = formatter.parseAndFormat(_value);
      if (dayjs(parsedAndFormatted, formattingString, true).isValid()) {
        return parsedAndFormatted;
      }
    }
    return undefined;
  }

  $: datePickerValue = getDatePickerValue(value);

  function open() {
    isOpen = true;
  }

  function close() {
    isOpen = false;
  }

  function checkAndBlur() {
    // check if clicked entry is on dropdown and then send event accordingly
    if (!isOpen) {
      dispatch('blur');
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      close();
    }
  }

  function onDropdownClose() {
    dispatch('blur');
  }

  function onValueChange(newValue: string) {
    value = formatter.parse(newValue).value;
    dispatch('artificialInput', value);
    dispatch('artificialChange', value);
  }
</script>

<FormattedInput
  {...$$restProps}
  bind:value
  {formatter}
  placeholder={formattingString}
  bind:element
  on:focus={open}
  on:focus
  on:blur={checkAndBlur}
  on:keydown={onKeydown}
  on:keydown
  on:artificialInput
  on:artificialChange
/>

<AttachableDropdown
  class="retain-active-cell no-max-height"
  trigger={element}
  bind:isOpen
  on:close={onDropdownClose}
>
  <InlineDateTimePicker
    {type}
    value={datePickerValue}
    format={formattingString}
    {timeShow24Hr}
    {timeEnableSeconds}
    on:change={(e) => onValueChange(e.detail)}
    on:dateChange={close}
  />
  <Presets
    bind:value
    isRelative={allowRelativePresets}
    {type}
    {formatter}
    on:change={close}
  />
</AttachableDropdown>
