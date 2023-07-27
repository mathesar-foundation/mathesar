<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { RadioGroup } from '@mathesar/component-library';
  import LabelInferenceTrue from './LabelInferenceTrue.svelte';
  import LabelInferenceFalse from './LabelInferenceFalse.svelte';

  type $$Props = ComponentProps<RadioGroup<boolean>>;

  /** True when column type inference is enabled */
  export let value = true;
</script>

<RadioGroup
  bind:value
  on:change
  boxed
  options={[true, false]}
  label="Column Types"
  getRadioLabel={(v) =>
    v ? { component: LabelInferenceTrue } : { component: LabelInferenceFalse }}
  {...$$restProps}
/>
