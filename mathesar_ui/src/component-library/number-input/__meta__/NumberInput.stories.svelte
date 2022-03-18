<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import NumberInput from '../NumberInput.svelte';

  const meta = {
    title: 'Components/NumberInput',
    component: NumberInput,
    argTypes: {
      element: {
        control: {
          disable: true,
        },
      },
    },
    parameters: {
      controls: {
        hideNoControlsWarning: true,
        expanded: true,
      },
      actions: {
        disabled: true,
      },
    },
  };

  let value = 12345;
</script>

<Meta {...meta} />

<Story name="Basic">
  <div class="wrapper">
    <NumberInput bind:value />
  </div>
  <div>
    Value:
    {#if value === undefined}
      <em>undefined</em>
    {:else if value === ''}
      <em>empty string</em>
    {:else}
      {value}
    {/if}
  </div>
  <div>
    Type: {typeof value}
  </div>
</Story>

<!-- <Story
  name="Integer input"
  args={{
    value: 10,
    isInteger: true,
  }}
  let:args
>
  <div style="position:relative;height:30px;width:280px;">
    <NumberInput {...args} />
  </div>
</Story> -->
<style>
  .wrapper {
    width: 280px;
  }
</style>
