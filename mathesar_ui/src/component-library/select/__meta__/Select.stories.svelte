<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Select from '../Select.svelte';

  const meta = {
    title: 'Components/Select',
    component: Select,
  };

  const aValues = [1, 2, 3];
  const aDefault = aValues[1];
  let a = aDefault;

  const bValues = [
    { foo: 'arst', bar: 'oien' },
    { foo: 'qyul', bar: 'zwfp' },
  ];
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const bGetLabel = (o) => `${o.foo}-${o.bar}`;
  const bDefault = bValues[0];
  let b = bDefault;
</script>

<Meta {...meta} />

<Story name="Basic">
  <div><Select options={aValues} bind:value={a} /></div>
  <div>
    Value: {a}
    <button
      on:click={() => {
        a = aDefault;
      }}>Reset</button
    >
  </div>
</Story>

<Story name="Objects as options">
  <div>
    <Select options={bValues} bind:value={b} getLabel={bGetLabel} />
  </div>
  <div>
    foo: {b?.foo}, bar: {b?.bar}
    <button
      on:click={() => {
        b = bDefault;
      }}>Reset</button
    >
  </div>
</Story>

<Story name="Trigger Apperances">
  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
    triggerAppearance="default"
  />

  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
    triggerAppearance="primary"
  />

  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
    triggerAppearance="secondary"
  />

  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
    triggerAppearance="plain"
  />

  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
    triggerAppearance="ghost"
  />
</Story>
