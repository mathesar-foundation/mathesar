<script>
  import { faCoffee, faRocket } from '@fortawesome/free-solid-svg-icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import RadioGroup from '../RadioGroup.svelte';

  const meta = {
    title: 'Components/RadioGroup',
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
      labelComponentProps: { data: faRocket },
    },
    {
      value: 'faCoffee',
      labelComponent: Icon,
      labelComponentProps: { data: faCoffee },
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
  <RadioGroup
    options={simpleOptions}
    bind:value={simpleValue}
    label="Simple options"
  />
</Story>

<Story name="Inline">
  <RadioGroup
    options={simpleOptions}
    bind:value={simpleValue}
    isInline
    label="Simple inline options"
  />
</Story>

<Story name="Rich text">
  <RadioGroup
    options={richOptions}
    bind:value={richValue}
    isInline
    label="Rich text"
    getRadioLabel={(o) => ({
      component: o.labelComponent,
      props: o.labelComponentProps,
    })}
  />
</Story>

<Story name="Inline wrapping">
  <RadioGroup
    options={manyOptions}
    bind:value={manyValue}
    isInline
    label="Inline options with wrapping"
  />
</Story>

<Story name="Long options">
  <RadioGroup
    options={longOptions}
    bind:value={longValue}
    label="Long options"
  />
</Story>
