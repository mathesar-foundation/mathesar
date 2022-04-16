<script>
  import {
    iconPlus,
    iconTable,
    iconUpload,
  } from '@mathesar-component-library-dir/common/icons';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import DropdownMenu from '@mathesar-component-library-dir/dropdown-menu/DropdownMenu.svelte';
  import MenuItem from '@mathesar-component-library-dir/menu/MenuItem.svelte';

  const meta = {
    title: 'Components/DropdownMenu',
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <DropdownMenu closeOnInnerClick={true} label="New Table" icon={iconPlus}>
    <MenuItem icon={iconTable}>Empty Table</MenuItem>
    <MenuItem icon={iconUpload}>Import Data</MenuItem>
  </DropdownMenu>
</Story>

<Story name="Long trigger">
  <DropdownMenu
    closeOnInnerClick={true}
    label="Lorem ipsum dolor sit amet"
    icon={iconPlus}
  >
    <MenuItem icon={iconTable}>Foo bar</MenuItem>
    <MenuItem icon={iconUpload}>Baz bat</MenuItem>
  </DropdownMenu>
</Story>

<Story name="Long Entries">
  <DropdownMenu closeOnInnerClick={true} label="Lorem" icon={iconPlus}>
    <MenuItem icon={iconTable}>Ut enim ad minim veniam</MenuItem>
    <MenuItem icon={iconUpload}>
      Duis aute irure dolor in reprehenderit
    </MenuItem>
  </DropdownMenu>
</Story>
