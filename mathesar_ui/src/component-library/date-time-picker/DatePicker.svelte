<script lang="ts">
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';
  import InlineDateTimePicker from './InlineDateTimePicker.svelte';

  export let value: string | null | undefined;
  export let dateFormat = 'YYYY-MM-DD';
  export let contentClass = '';

  let element: HTMLInputElement;
  let isOpen = false;

  function open() {
    isOpen = true;
  }
</script>

<TextInput
  {...$$restProps}
  bind:element
  bind:value
  placeholder={dateFormat}
  on:focus={open}
  on:keydown
  on:input
/>
<AttachableDropdown class={contentClass} trigger={element} bind:isOpen on:close>
  <InlineDateTimePicker type="date" bind:value format={dateFormat} on:change />
</AttachableDropdown>
