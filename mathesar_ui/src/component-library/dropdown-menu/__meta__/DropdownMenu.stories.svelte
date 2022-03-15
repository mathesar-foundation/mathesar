<script>
  import { faPlus, faTable, faUpload } from '@fortawesome/free-solid-svg-icons';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import DropdownMenu from '@mathesar-component-library-dir/dropdown-menu/DropdownMenu.svelte';
  import MenuItem from '@mathesar-component-library-dir/menu/MenuItem.svelte';

  const meta = {
    title: 'Components/DropdownMenu',
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <DropdownMenu
    closeOnInnerClick={true}
    label="New Table"
    icon={{ data: faPlus }}
  >
    <MenuItem icon={{ data: faTable }}>Empty Table</MenuItem>
    <MenuItem icon={{ data: faUpload }}>Import Data</MenuItem>
  </DropdownMenu>
</Story>

<Story name="Long trigger">
  <DropdownMenu
    closeOnInnerClick={true}
    label="Lorem ipsum dolor sit amet"
    icon={{ data: faPlus }}
  >
    <MenuItem icon={{ data: faTable }}>Foo bar</MenuItem>
    <MenuItem icon={{ data: faUpload }}>Baz bat</MenuItem>
  </DropdownMenu>
</Story>

<Story name="Long Entries">
  <DropdownMenu closeOnInnerClick={true} label="Lorem" icon={{ data: faPlus }}>
    <MenuItem icon={{ data: faTable }}>Ut enim ad minim veniam</MenuItem>
    <MenuItem icon={{ data: faUpload }}>
      Duis aute irure dolor in reprehenderit
    </MenuItem>
  </DropdownMenu>
</Story>
