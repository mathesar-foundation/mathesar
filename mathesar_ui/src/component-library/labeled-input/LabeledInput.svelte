<script lang="ts">
  import Label from '@mathesar-component-library-dir/label/Label.svelte';
  import type { LabeledInputLayout } from './LabeledInputTypes';

  export let label: string | undefined = undefined;
  export let help: string | undefined = '';
  export let layout: LabeledInputLayout = 'inline';
</script>

<div
  class="labeled-input"
  class:layout-stacked={layout === 'stacked'}
  class:layout-inline={layout === 'inline'}
  class:layout-inline-input-first={layout === 'inline-input-first'}
>
  <Label>
    <span class="label-content">
      <span class="label">
        {label}
        <slot name="label" />
      </span>
      <span class="help">
        {help}
        <slot name="help" />
      </span>
      <span class="input"><slot /></span>
    </span>
  </Label>
</div>
