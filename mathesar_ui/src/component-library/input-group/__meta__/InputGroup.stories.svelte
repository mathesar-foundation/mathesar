<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import InputGroup from '../InputGroup.svelte';
  import InputGroupText from '../InputGroupText.svelte';

  const meta = {
    title: 'Components/InputGroup',
    component: InputGroup,
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

<Story name="Basic - Group inputs">
  <div style="position:relative;height:30px;width:280px;">
    <InputGroup>
      <TextInput value="Pikachu" />
      <TextInput value="Raichu" />
    </InputGroup>
  </div>
</Story>

<Story name="Prepend and Append Content">
  <InputGroup>
    <TextInput placeholder="user" />
    <InputGroupText>@domain.com</InputGroupText>
  </InputGroup>

  <InputGroup>
    <InputGroupText>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </InputGroupText>
    <TextInput placeholder="Username" />
  </InputGroup>

  <InputGroup>
    <InputGroupText>www.</InputGroupText>
    <TextInput placeholder="Domain name" />
    <InputGroupText>.com</InputGroupText>
  </InputGroup>

  <style>
    .input-group {
      margin: 30px 0px;
    }
  </style>
</Story>
