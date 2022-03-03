<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import SimpleSelect from '../SimpleSelect.svelte';

  const meta = {
    title: 'Components/SimpleSelect',
  };

  const aValues = [1, 2, 3];
  const aDefault = aValues[0];
  let a = 2;

  const bValues = [
    { foo: 'arst', bar: 'oien' },
    { foo: 'qyul', bar: 'zwfp' },
  ];
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const bGetLabel = (o) => `${o.foo}-${o.bar}`;
  const bDefault = bValues[0];
  let b = bValues[0];
</script>

<Meta {...meta} />

<Story name="Basic">
  <div><SimpleSelect values={aValues} bind:value={a} /></div>
  <div>
    Value: {a}
    <button
      on:click={() => {
        a = aDefault;
      }}>Reset</button
    >
  </div>
</Story>

<hr />

<Story name="Basic">
  <div>
    <SimpleSelect values={bValues} bind:value={b} getLabel={bGetLabel} />
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
