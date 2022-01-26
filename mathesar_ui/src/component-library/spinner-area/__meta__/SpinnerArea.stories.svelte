<script>
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import SpinnerArea from '../SpinnerArea.svelte';

  const meta = {
    title: 'Components/SpinnerArea',
  };

  let isLoading = false;
</script>

<Meta {...meta} />

<Story name="Basic">
  <SpinnerArea isSpinning={isLoading} hasOverlay={false}>
    <TextInput disabled={isLoading} />
  </SpinnerArea>

  <LabeledInput label="Is loading" layout="inline-input-first">
    <Checkbox bind:checked={isLoading} />
  </LabeledInput>
</Story>
