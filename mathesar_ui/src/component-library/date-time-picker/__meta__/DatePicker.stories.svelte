<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';
  import DatePicker from '../DatePicker.svelte';

  const meta = {
    title: 'Components/DatePicker',
    component: DatePicker,
    parameters: {
      controls: {
        hideNoControlsWarning: true,
        expanded: true,
      },
    },
  };

  let element;
  let isOpen = false;
  let value;

  function open() {
    isOpen = true;
  }

  function close() {
    isOpen = false;
  }
</script>

<Meta {...meta} />

<Story name="Basic">
  <TextInput
    bind:element
    bind:value
    on:focus={open}
    placeholder="Click on this input"
  />
  <AttachableDropdown trigger={element} bind:isOpen on:close={close}>
    <DatePicker bind:value />
  </AttachableDropdown>
</Story>
