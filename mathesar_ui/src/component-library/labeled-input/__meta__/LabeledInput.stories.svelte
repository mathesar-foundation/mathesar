<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Checkbox from '@mathesar/component-library/checkbox/Checkbox.svelte';
  import LabeledInput from '../LabeledInput.svelte';

  const meta = {
    title: 'Components/LabeledInput',
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <p>
    <LabeledInput label="Yep">
      <Checkbox checked />
    </LabeledInput>
  </p>

  <p>
    <LabeledInput label="This is a label" inputFirst>
      <Checkbox />
    </LabeledInput>
  </p>

  <p>
    <LabeledInput inputFirst>
      <span slot=label><strong>Lorem ipsum</strong> dolor sit amet consectetur adipisicing elit. Nam vel odio, dignissimos veritatis assumenda ratione dolor eveniet quam fuga officia tempore facilis eius maiores consectetur aliquam inventore! Inventore, ipsum illo.</span>
      <Checkbox />
    </LabeledInput>
  </p>
</Story>
