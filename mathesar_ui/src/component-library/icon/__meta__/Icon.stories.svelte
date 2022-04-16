<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import {
    iconCat,
    iconDog,
    iconBug,
    iconHippo,
    iconKiwiBird,
  } from '@mathesar-component-library-dir/common/icons';
  import Icon from '../Icon.svelte';
  import IconDocs from './Icon.mdx';
  import { IconFlip, IconRotate } from '../IconTypes';

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
  <Icon {...iconCat} size="25px" />

  <Icon {...iconCat} flip={IconFlip.VERTICAL} />
  <Icon {...iconCat} rotate={IconRotate.ONE_EIGHTY} />

  <Icon {...iconDog} class="color-red" size="20px" />
  <Icon {...iconHippo} style="color:blue" size="24px" />

  <Icon {...iconBug} spin={true} />
  <Icon {...iconKiwiBird} pulse={true} size="1.2em" style="color:green" />

  <style>
    .color-red {
      color: red;
    }
  </style>
</Story>
