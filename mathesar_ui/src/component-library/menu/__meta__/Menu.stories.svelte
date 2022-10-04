<script>
  import {
    faAirFreshener,
    faChair,
    faClock,
    faHammer,
    faLeaf,
    faMagnet,
    faPhone,
    faShip,
    faVideo,
  } from '@fortawesome/free-solid-svg-icons';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Menu from '../Menu.svelte';
  import ButtonMenuItem from '../ButtonMenuItem.svelte';
  import CheckboxMenuItem from '../CheckboxMenuItem.svelte';
  import LinkMenuItem from '../LinkMenuItem.svelte';
  import MenuDivider from '../MenuDivider.svelte';
  import MenuHeading from '../MenuHeading.svelte';

  const meta = {
    title: 'Components/Menu',
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <Menu>
    <MenuHeading>Link Menu Items</MenuHeading>
    <LinkMenuItem href="/FOO" icon={{ data: faAirFreshener }}>
      Dolor sit amet
    </LinkMenuItem>
    <LinkMenuItem href="/BAR" icon={{ data: faLeaf }}>
      Eiusmod tempor
    </LinkMenuItem>
    <MenuDivider />

    <MenuHeading>Button Menu Items</MenuHeading>
    <ButtonMenuItem icon={{ data: faChair }} disabled>
      Consectetur adipiscing
    </ButtonMenuItem>
    <ButtonMenuItem icon={{ data: faHammer }}>
      Labore et dolore magna
    </ButtonMenuItem>
    <ButtonMenuItem icon={{ data: faMagnet, rotate: 90 }}>
      Sed do <em>eiusmod</em>
    </ButtonMenuItem>
    <ButtonMenuItem icon={{ data: faVideo }}>Minim veniam</ButtonMenuItem>
    <MenuDivider />

    <MenuHeading>Checkbox Menu Items</MenuHeading>
    <CheckboxMenuItem icon={{ data: faPhone }}>Ut aliqua</CheckboxMenuItem>
    <CheckboxMenuItem checked>Nostrud exercitation</CheckboxMenuItem>
    <CheckboxMenuItem icon={{ data: faShip }} checked disabled>
      Aliquip ex ea commod
    </CheckboxMenuItem>
    <CheckboxMenuItem icon={{ data: faClock }} checked>
      Sinlar po ret leucdal aud
    </CheckboxMenuItem>
  </Menu>
</Story>
