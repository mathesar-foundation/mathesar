<script lang="ts">
  import Label from '@mathesar-component-library-dir/label/Label.svelte';

  import Help from '../help/Help.svelte';

  import type { LabeledInputLayout } from './LabeledInputTypes';

  export let label: string | undefined = undefined;
  export let help: string | undefined = undefined;
  export let layout: LabeledInputLayout = 'inline';
  export let helpType: 'inline' | 'tooltip' = 'inline';

  $: displayHelp = $$slots.help || help;
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
      <span class="labeled-input-label">
        {label ?? ''}
        <slot name="label" />

        {#if displayHelp && helpType === 'tooltip'}
          <Help>{help ?? ''}<slot name="help" /></Help>
        {/if}
      </span>
      <span class="labeled-input-slot"><slot /></span>
      {#if displayHelp && helpType === 'inline'}
        <span class="help">{help ?? ''}<slot name="help" /></span>
      {/if}
    </span>
  </Label>
</div>
