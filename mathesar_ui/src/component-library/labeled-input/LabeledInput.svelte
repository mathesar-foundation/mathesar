<script lang="ts">
  import Label from '@mathesar-component-library-dir/label/Label.svelte';
  import type { LabeledInputLayout } from './LabeledInput.d';

  export let label: string | undefined = undefined;
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
        {#if $$slots.label}<slot name="label" />{:else}{label}{/if}
      </span>
      <span class="input"><slot /></span>
    </span>
  </Label>
</div>
