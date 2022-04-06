<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import LabeledInput from '../LabeledInput.svelte';

  const meta = {
    title: 'Components/LabeledInput',
  };
</script>

<Meta {...meta} />

<Story name="Inline">
  <LabeledInput label="Yep" layout="inline">
    <Checkbox />
  </LabeledInput>
</Story>

<Story name="Stacked">
  <LabeledInput label="This is a label" layout="stacked">
    <Checkbox />
  </LabeledInput>
</Story>

<Story name="Inline input first">
  <LabeledInput label="This is a label" layout="inline-input-first">
    <Checkbox />
  </LabeledInput>
</Story>

<Story name="Long rich text label">
  <LabeledInput layout="inline-input-first">
    <span slot="label"
      ><strong>Lorem ipsum</strong> dolor sit amet consectetur adipisicing elit.
      Nam vel odio, dignissimos veritatis assumenda ratione dolor eveniet quam fuga
      officia tempore facilis eius maiores consectetur aliquam inventore! Inventore,
      ipsum illo.</span
    >
    <Checkbox />
  </LabeledInput>
</Story>
