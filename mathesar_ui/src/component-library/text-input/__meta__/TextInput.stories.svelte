<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import TextInput from '../TextInput.svelte';
  import TextInputDocs from './TextInput.mdx';

  const meta = {
    title: 'Components/TextInput',
    component: TextInput,
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
      docs: {
        page: TextInputDocs,
        source: {
          type: 'code',
        },
      },
    },
  };
</script>

<Meta {...meta} />

<Story
  name="Basic"
  args={{
    value: 'Pikachu',
  }}
  let:args
>
  <div style="position:relative;height:30px;width:280px;">
    <TextInput {...args} />
  </div>
</Story>
