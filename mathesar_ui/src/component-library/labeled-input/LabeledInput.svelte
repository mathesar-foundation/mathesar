<script lang="ts">
  import Label from '@mathesar-component-library-dir/label/Label.svelte';
  import Help from '../help/Help.svelte';
  import type { LabeledInputLayout } from './LabeledInputTypes';

  export let label: string | undefined = '';
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
    {#if label === 'Support Time Zones'}
      <!-- {layout='inline-input-first'} -->
      <Help>
        When this box is not checked, values will be stored irrespective of
        any specific time zone. All Mathesar users will see the values
        displayed identically, regardless of the time zone in which they
        happen to be viewing the data. This is a simpler option and is
        appropriate when the intended timezone of the data is obvious to all
        users.<br/><br/> When this box is checked, all values will be stored in UTC
        time. Values will be converted to local time for display using the
        time zone offset supplied by the user's web browser. This means that
        Mathesar users in different time zones will see values displayed
        differently, in order for their understanding of those values to be
        synchronized. User input will be assumed to be in local time and
        will be converted to UTC for storage. This means that if you
        un-check this box later or convert this column to Text, the values
        after conversion will all be displayed in UTC time.
      </Help>
    {/if}
  </Label>
</div>
