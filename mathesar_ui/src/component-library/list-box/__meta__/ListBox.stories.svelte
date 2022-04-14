<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';
  import ListBox from '../ListBox.svelte';
  import ListBoxOptions from '../ListBoxOptions.svelte';

  const meta = {
    title: 'Components/ListBox',
    component: ListBox,
  };

  const options = [
    'Pichu',
    'Pikachu',
    'Raichu',
    'Bulbasaur',
    'Ivysaur',
    'Venosaur',
  ];

  let basic = [];
  let singleSelect = [];

  let trigger;
  let inDropdown = [];
</script>

<Meta {...meta} />

<Story name="Basic">
  <div>
    <ListBox {options} bind:value={basic}>
      <ListBoxOptions />
    </ListBox>
  </div>
  <div>
    ({basic.length}) selected options: {basic.length > 0
      ? basic.join(', ')
      : []}
  </div>
</Story>

<Story name="Basic - single select">
  <div>
    <ListBox selectionType="single" {options} bind:value={singleSelect}>
      <ListBoxOptions />
    </ListBox>
  </div>
  <div>
    Selected option: {singleSelect[0]}
  </div>
</Story>

<Story name="Options in a dropdown">
  <div>
    <ListBox {options} bind:value={inDropdown} let:api let:isOpen>
      <Button
        bind:element={trigger}
        on:click={() => api.toggle()}
        on:keydown={(e) => api.handleKeyDown(e)}
      >
        Number of selected options: ({inDropdown.length})
      </Button>

      <AttachableDropdown {trigger} {isOpen} on:close={() => api.close()}>
        <ListBoxOptions />
      </AttachableDropdown>
    </ListBox>
  </div>
</Story>
