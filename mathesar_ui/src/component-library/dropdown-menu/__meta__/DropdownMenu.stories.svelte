<script>
  import { faPlus, faTable, faUpload } from '@fortawesome/free-solid-svg-icons';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import DropdownMenu from '@mathesar-component-library-dir/dropdown-menu/DropdownMenu.svelte';
  import ButtonMenuItem from '@mathesar-component-library-dir/menu/ButtonMenuItem.svelte';

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
    <ButtonMenuItem icon={{ data: faTable }}>Empty Table</ButtonMenuItem>
    <ButtonMenuItem icon={{ data: faUpload }}>Import Data</ButtonMenuItem>
  </DropdownMenu>
</Story>

<Story name="Long trigger">
  <DropdownMenu
    closeOnInnerClick={true}
    label="Lorem ipsum dolor sit amet"
    icon={{ data: faPlus }}
  >
    <ButtonMenuItem icon={{ data: faTable }}>Foo bar</ButtonMenuItem>
    <ButtonMenuItem icon={{ data: faUpload }}>Baz bat</ButtonMenuItem>
  </DropdownMenu>
</Story>

<Story name="Long Entries">
  <DropdownMenu closeOnInnerClick={true} label="Lorem" icon={{ data: faPlus }}>
    <ButtonMenuItem icon={{ data: faTable }}>
      Ut enim ad minim veniam
    </ButtonMenuItem>
    <ButtonMenuItem icon={{ data: faUpload }}>
      Duis aute irure dolor in reprehenderit
    </ButtonMenuItem>
  </DropdownMenu>
</Story>
