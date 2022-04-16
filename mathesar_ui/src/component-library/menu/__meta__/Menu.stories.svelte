<script>
  import {
    iconAirFreshener,
    iconChair,
    iconClock,
    iconHammer,
    iconLeaf,
    iconMagnet,
    iconPhone,
    iconShip,
    iconVideo,
  } from '@mathesar-component-library-dir/common/icons';

  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import { IconRotate } from '@mathesar-component-library-dir/icon/IconTypes';
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
    <MenuItem icon={iconAirFreshener}>Dolor sit amet</MenuItem>
    <MenuItem icon={iconLeaf}>Eiusmod tempor</MenuItem>
    <MenuDivider />
    <MenuHeading>Officia deserunt</MenuHeading>
    <MenuItem icon={iconChair} disabled>Consectetur adipiscing</MenuItem>
    <MenuItem icon={iconHammer}>Labore et dolore magna</MenuItem>
    <MenuItem icon={{ iconMagnet, rotate: IconRotate.NINETY }}>
      Sed do <em>eiusmod</em>
    </MenuItem>
    <MenuItem icon={iconVideo}>Minim veniam</MenuItem>
    <MenuDivider />
    <MenuHeading>Non proident</MenuHeading>
    <MenuItem icon={iconPhone}>
      <Checkbox slot="control" />
      Ut aliqua
    </MenuItem>
    <MenuItem>
      <Checkbox slot="control" checked />
      Nostrud exercitation
    </MenuItem>
    <MenuItem icon={iconShip} disabled>
      <!--
        NOTE: to disable the form control when the MenuItem is disabled, you
        need to explicitly set the `disabled` attribute on the form control.
      -->
      <Checkbox slot="control" checked disabled />
      Aliquip ex ea commod
    </MenuItem>
    <MenuItem icon={iconClock}>
      <Checkbox slot="control" checked />
      Sinlar po ret leucdal aud
    </MenuItem>
  </Menu>
</Story>
