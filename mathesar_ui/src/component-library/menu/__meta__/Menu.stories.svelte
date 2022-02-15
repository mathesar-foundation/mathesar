<script>
  import {
    faAirFreshener,
    faChair,
    faHammer,
    faLeaf,
    faMagnet,
    faPhone,
    faShip,
    faVideo,
  } from '@fortawesome/free-solid-svg-icons';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import Menu from '../Menu.svelte';
  import MenuItem from '../MenuItem.svelte';
  import MenuDivider from '../MenuDivider.svelte';
  import MenuHeading from '../MenuHeading.svelte';

  const meta = {
    title: 'Components/Menu',
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <Menu>
    <MenuHeading>Lorem ipsum</MenuHeading>
    <MenuItem icon={{ data: faAirFreshener }}>Dolor sit amet</MenuItem>
    <MenuItem icon={{ data: faLeaf }}>Eiusmod tempor</MenuItem>
    <MenuDivider />
    <MenuHeading>Officia deserunt</MenuHeading>
    <MenuItem icon={{ data: faChair }} disabled>
      Consectetur adipiscing
    </MenuItem>
    <MenuItem icon={{ data: faHammer }}>Labore et dolore magna</MenuItem>
    <MenuItem icon={{ data: faMagnet }}>Sed do <em>eiusmod</em></MenuItem>
    <MenuItem icon={{ data: faVideo }}>Minim veniam</MenuItem>
    <MenuDivider />
    <MenuHeading>Non proident</MenuHeading>
    <MenuItem icon={{ data: faPhone }}>
      <Checkbox slot="control" />
      Ut aliqua
    </MenuItem>
    <MenuItem>
      <Checkbox slot="control" checked />
      Nostrud exercitation
    </MenuItem>
    <MenuItem icon={{ data: faShip }}>
      <Checkbox slot="control" checked />
      Aliquip ex ea commod
    </MenuItem>
  </Menu>
</Story>
