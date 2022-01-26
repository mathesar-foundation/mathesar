<script lang="ts">
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
</script>

<Meta {...meta} />

<Story
  name="Basic"
  args={{
    value: 10,
  }}
  let:args
>
  <div style="position:relative;height:30px;width:280px;">
    <NumberInput {...args} />
  </div>
</Story>

<Story
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
</Story>
