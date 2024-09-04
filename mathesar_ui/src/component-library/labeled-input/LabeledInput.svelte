<script lang="ts">
  import Label from '@mathesar-component-library-dir/label/Label.svelte';

  import type { LabeledInputLayout } from './LabeledInputTypes';

  export let label: string | undefined = undefined;
  export let help: string | undefined = undefined;
  export let layout: LabeledInputLayout = 'inline';
  export let description: string | undefined = undefined;
</script>

<div
  class="labeled-input"
  class:layout-stacked={layout === 'stacked'}
  class:layout-inline={layout === 'inline'}
  class:layout-inline-input-first={layout === 'inline-input-first'}
>
  <Label>
    <span class="label-content">
      <!--
        ⚠️ NOTE: Do not add any white space within `.label` or `.help`. We have
        CSS that uses the `:empty` pseudo-class which does not work if there is
        white space.
      -->
      <span class="label">{label ?? ''}<slot name="label" /></span>
      <span class="input"><slot /></span>

      <span class="help">{help ?? ''}<slot name="help" /></span>
    </span>
    <span class="description">
      <slot name="description" />
    </span>
  </Label>
</div>
