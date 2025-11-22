<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Debounce from '../Debounce.svelte';

  let value = 'Hello';
</script>

<Meta title="Components/Debounce" />

<Story name="Basic">
  <Debounce bind:value let:input let:change duration={1000}>
    <div>
      <input type="text" {value} on:input={input} on:change={change} />
    </div>
    <div>
      {value}
    </div>
  </Debounce>
</Story>
