<script lang="ts">
  import { RadioGroup } from '@mathesar/component-library';
  import LabelInferenceTrue from './LabelInferenceTrue.svelte';
  import LabelInferenceFalse from './LabelInferenceFalse.svelte';

  export let value = true;
</script>

<RadioGroup
  bind:value
  boxed
  options={[true, false]}
  label="Column type inference"
  getRadioLabel={(v) =>
    v ? { component: LabelInferenceTrue } : { component: LabelInferenceFalse }}
/>
