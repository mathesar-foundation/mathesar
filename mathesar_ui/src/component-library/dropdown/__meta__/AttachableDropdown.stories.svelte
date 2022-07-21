<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import AttachableDropdown from '../AttachableDropdown.svelte';

  const meta = {
    title: 'Components/AttachableDropdown',
    component: AttachableDropdown,
    parameters: {
      controls: {
        hideNoControlsWarning: true,
        expanded: true,
      },
    },
  };

  let element;
  let isOpen = false;

  function open() {
    isOpen = true;
  }

  function close() {
    isOpen = false;
  }
</script>

<Meta {...meta} />

<Story name="Basic">
  <TextInput bind:element on:focus={open} placeholder="Click on this input" />
  <AttachableDropdown trigger={element} bind:isOpen on:close={close}>
    <div style="padding:10px;">
      This dropdown can be attached to any element
    </div>
  </AttachableDropdown>
</Story>
