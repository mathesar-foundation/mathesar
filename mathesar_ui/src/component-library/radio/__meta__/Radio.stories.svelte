<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';
  import Radio from '../Radio.svelte';

  const meta = {
    title: 'Components/Radio',
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <p>Within <Radio /> some text.</p>

  <p>
    <LabeledInput label="With a form label" layout="inline-input-first">
      <Radio />
    </LabeledInput>
  </p>

  <p>
    <LabeledInput label="Disabled" layout="inline-input-first">
      <Radio disabled />
    </LabeledInput>
  </p>
</Story>
