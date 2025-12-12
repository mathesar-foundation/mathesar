<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import {
    faCat,
    faDog,
    faBug,
    faHippo,
    faKiwiBird,
  } from '@fortawesome/free-solid-svg-icons';
  import Icon from '../Icon.svelte';
  import IconDocs from './Icon.mdx';

  const meta = {
    title: 'Components/Icon',
    component: Icon,
    argTypes: {
      data: {
        table: {
          type: { summary: 'IconDefinition' },
        },
      },
      flip: {
        control: {
          type: 'inline-radio',
          options: ['horizontal', 'vertical', 'both', undefined],
        },
        table: {
          type: { summary: 'enum' },
        },
      },
      rotate: {
        control: { type: 'inline-radio', options: [90, 180, 270, undefined] },
        table: {
          type: { summary: 'enum' },
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
        page: IconDocs,
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
    data: faCat,
    size: '50px',
  }}
  let:args
>
  <Icon {...args} />
</Story>

<Story name="Customizations" parameters={disabledAddons}>
  <Icon data={faCat} size="25px" />

  <Icon data={faCat} flip="vertical" />
  <Icon data={faCat} rotate={180} />

  <Icon data={faDog} class="color-red" size="20px" />
  <Icon data={faHippo} style="color:blue" size="24px" />

  <Icon data={faBug} spin={true} />
  <Icon data={faKiwiBird} pulse={true} size="1.2em" style="color:green" />

  <style>
    .color-red {
      color: red;
    }
  </style>
</Story>
