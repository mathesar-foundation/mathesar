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
      allowFloat: { control: 'boolean', defaultValue: false },
      allowNegative: { control: 'boolean', defaultValue: false },
      locale: {
        type: { name: 'string', required: false },
        control: 'select',
        options: ['en-US', 'de-DE'],
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

<Story name="Basic" let:args>
  <div class="wrapper">
    <NumberInput {...args} bind:value />
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

<style>
  .wrapper {
    width: 280px;
  }
</style>
