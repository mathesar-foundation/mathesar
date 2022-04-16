<script>
  import {
    iconCoffee,
    iconRocket,
  } from '@mathesar-component-library-dir/common/icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import CheckboxGroup from '../CheckboxGroup.svelte';

  const meta = {
    title: 'Components/CheckboxGroup',
  };

  const simpleOptions = [
    { value: 1, label: 'One' },
    { value: 2, label: 'Two' },
  ];
  let simpleValue;

  const richOptions = [
    {
      value: 'faRocket',
      labelComponent: Icon,
      labelComponentProps: iconCoffee,
    },
    {
      value: 'faCoffee',
      labelComponent: Icon,
      labelComponentProps: iconRocket,
    },
  ];
  let richValue;

  const longOptions = [
    {
      value: 1,
      label:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    { value: 2, label: 'Ut enim ad minim veniam.' },
    {
      value: 3,
      label:
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    },
  ];
  let longValue;

  const manyOptions = [
    { value: 1, label: 'Lorem ipsum dolor sit amet' },
    { value: 2, label: 'Consectetur adipiscing elit' },
    { value: 3, label: 'This one is disabled!', disabled: true },
    { value: 4, label: 'Incididunt ut' },
  ];
  let manyValue;
</script>

<Meta {...meta} />

<Story name="Basic">
  <CheckboxGroup
    options={simpleOptions}
    bind:values={simpleValue}
    label="Simple options"
  />
  <p>Values: [{simpleValue}]</p>
  <p>
    <Button
      on:click={() => {
        simpleValue = [2];
      }}>Set to [2]</Button
    >
  </p>
</Story>

<Story name="Inline">
  <CheckboxGroup
    options={simpleOptions}
    bind:values={simpleValue}
    isInline
    label="Simple inline options"
  />
</Story>

<Story name="Rich text">
  <CheckboxGroup
    options={richOptions}
    bind:values={richValue}
    isInline
    label="Rich text"
  />
</Story>

<Story name="Many values">
  <CheckboxGroup
    options={manyOptions}
    bind:values={manyValue}
    isInline
    label="Inline options with wrapping"
  />
</Story>

<Story name="Long values">
  <CheckboxGroup
    options={longOptions}
    bind:values={longValue}
    label="Long options"
  />
</Story>
