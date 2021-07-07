<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import TextInput from '../TextInput.svelte';
  import TextInputDocs from './TextInput.mdx';

  let value: string;

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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        page: TextInputDocs,
        source: {
          type: 'code',
        },
      },
    },
  };

  const disabledAddons = {
    controls: {
      disabled: true,
    },
    actions: {
      disabled: true,
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

<Story name="Slotted" parameters={disabledAddons}>
  <TextInput class="slot-bg" bind:value style="width:280px">
    <svelte:fragment slot="append">
      .com
    </svelte:fragment>
  </TextInput>

  <p></p>

  <TextInput bind:value style="width:280px">
    <svelte:fragment slot="prepend">
      <!-- svg taken from feather icon: user -->
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </svelte:fragment>
  </TextInput>

  <p></p>

  <TextInput value='Bulbasaur' class='with-both-slots'>
    <svelte:fragment slot="prepend">
      I, 
    </svelte:fragment>
    <svelte:fragment slot="append">
      , agree to your terms.
    </svelte:fragment>
  </TextInput>

  <style>
    .text-input.slot-bg .append {
      background: #efefef;
      padding: 6px 10px;
    }
    .text-input.with-both-slots {
      display:inline-flex
    }
    .text-input.with-both-slots .append {
      white-space: nowrap;
      margin-right: 8px;
    }
  </style>
</Story>
