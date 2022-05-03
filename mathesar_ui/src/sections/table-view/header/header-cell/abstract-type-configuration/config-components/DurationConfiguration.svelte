<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { DurationUnit } from '@mathesar/api/tables/columns';
  import { LabeledInput, Select } from '@mathesar-component-library';
  import type { FormValues } from '@mathesar-component-library/types';

  interface DurationFormValues extends FormValues {
    min: DurationUnit;
    max: DurationUnit;
  }

  export let store: Writable<DurationFormValues>;

  const options: DurationUnit[] = ['d', 'h', 'm', 's', 'ms'];
  const labels: Record<DurationUnit, string> = {
    d: 'days',
    h: 'hours',
    m: 'minutes',
    s: 'seconds',
    ms: 'milliseconds',
  };
  const getLabel = (opt?: DurationUnit) => (opt && labels[opt]) ?? '';
</script>

<div class="form-element form-input">
  <LabeledInput label="Max Time Unit" layout="stacked">
    <Select {options} bind:value={$store.max} {getLabel} />
  </LabeledInput>
</div>

<div class="form-element form-input">
  <LabeledInput label="Min Time Unit" layout="stacked">
    <Select {options} bind:value={$store.min} {getLabel} />
  </LabeledInput>
</div>

<div class="form-element">Format:</div>
