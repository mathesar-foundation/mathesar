<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Button from '../Button.svelte';
  import ButtonDocs from './Button.mdx';

  const argTypes = {
    onClick: { action: 'click', table: { disable: true } },
    slotContent: {
      control: {
        type: 'text',
      },
      description: 'Slot content of button. Allows any DOM element.',
    },
    element: {
      control: {
        disable: true,
      },
    },
    appearance: {
      control: {
        type: 'select',
        options: ['default', 'primary', 'secondary', 'plain', 'ghost'],
      },
    },
  };

  const meta = {
    title: 'Components/Button',
    component: Button,
    parameters: {
      controls: {
        hideNoControlsWarning: true,
        expanded: true,
      },
      docs: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        page: ButtonDocs,
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
    appearance: 'default',
    slotContent: 'Basic button',
  }}
  {argTypes}
  let:args
>
  <Button {...args} on:click={args.onClick}>
    {args.slotContent || 'Click me!'}
  </Button>
</Story>

<Story name="Appearances" parameters={disabledAddons}>
  <Button appearance="default">Default button</Button>
  <Button appearance="primary">Primary button</Button>
  <Button appearance="secondary">Secondary button</Button>
  <Button appearance="plain">Plain button</Button>
  <Button appearance="ghost">Ghost button</Button>
</Story>

<Story name="Sizes" parameters={disabledAddons}>
  <Button size="small">Small button</Button>
  <Button size="medium">Medium button</Button>
  <Button size="large">Large button</Button>
</Story>

<Story name="Custom styling" parameters={disabledAddons}>
  <Button class="party">Join party!</Button>
  <Button style="background:yellow">Buy now!</Button>

  <style>
    button.btn.party {
      background: #ff4d4f;
      color: #fff;
    }
    button.btn.party:hover {
      background: #ff3e40;
    }
    button.btn.party:active {
      background: #e62b2d;
    }
  </style>
</Story>

<Story name="Composite" parameters={disabledAddons}>
  <Button size="small">
    <!-- svg taken from feather icon: download -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  </Button>

  <Button appearance="primary" class="unlock">
    <!-- svg taken from feather icon: key -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0
                0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
      />
    </svg>
    <span>Unlock</span>
  </Button>

  <style>
    button.btn.unlock {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
  </style>
</Story>
