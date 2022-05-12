<script lang="ts">
  import { dayjs, isDefinedNonNullable } from '@mathesar-component-library';
  import { createEventDispatcher } from 'svelte';
  import {
    FormattedInput,
    InlineDateTimePicker,
    AttachableDropdown,
  } from '@mathesar-component-library';
  import type {
    DateCellExternalProps,
    DateCellProps,
  } from '../typeDefinitions';

  const dispatch = createEventDispatcher();

  type $$Props = DateCellExternalProps & { value: DateCellProps['value'] };

  export let dateFormattingString: $$Props['dateFormattingString'];
  export let formatter: $$Props['formatter'];

  export let value: $$Props['value'];

  let element: HTMLInputElement;
  let isOpen = false;

  function getDatePickerValue(_value: $$Props['value']): string | undefined {
    if (isDefinedNonNullable(_value)) {
      const parsedAndFormatted = formatter.parseAndFormat(_value);
      if (dayjs(parsedAndFormatted, dateFormattingString, true).isValid()) {
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

  function onDropdownClose() {
    dispatch('blur');
  }

  function onValueChange(newValue: string) {
    value = formatter.parse(newValue).value;
    close();
  }
</script>

<FormattedInput
  focusOnMount={true}
  bind:value
  {formatter}
  placeholder={dateFormattingString}
  bind:element
  on:focus={open}
  on:focus
  on:blur={checkAndBlur}
  on:keydown
/>

<AttachableDropdown
  class="retain-active-cell"
  trigger={element}
  bind:isOpen
  on:close={onDropdownClose}
>
  <InlineDateTimePicker
    value={datePickerValue}
    dateFormat={dateFormattingString}
    on:change={(e) => onValueChange(e.detail)}
  />
</AttachableDropdown>
