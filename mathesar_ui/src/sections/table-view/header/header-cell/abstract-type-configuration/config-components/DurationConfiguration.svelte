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

  function calculateFormat(_storeValue: DurationFormValues): string {
    const range = options.slice(
      options.indexOf(_storeValue.max),
      options.indexOf(_storeValue.min) + 1,
    );
    if (range[range.length - 1] === 'ms') {
      return `${range.slice(0, range.length - 1).join(':')}.${
        range[range.length - 1]
      }`;
    }
    return range.join(':');
  }

  $: format = calculateFormat($store);

  function onMaxChange(_max?: DurationUnit) {
    if (!_max) return;
    let { min } = $store;
    if (options.indexOf(_max) > options.indexOf($store.min)) {
      min = _max;
    }
    $store = {
      ...$store,
      max: _max,
      min,
    };
  }

  function onMinChange(_min?: DurationUnit) {
    if (!_min) return;
    let { max } = $store;
    if (options.indexOf(_min) < options.indexOf($store.max)) {
      max = _min;
    }
    $store = {
      ...$store,
      max,
      min: _min,
    };
  }
</script>

<div class="form-element form-input">
  <LabeledInput label="Max Time Unit" layout="stacked">
    <Select
      {options}
      value={$store.max}
      {getLabel}
      on:change={(e) => onMaxChange(e.detail)}
    />
  </LabeledInput>
</div>

<div class="form-element form-input">
  <LabeledInput label="Min Time Unit" layout="stacked">
    <Select
      {options}
      value={$store.min}
      {getLabel}
      on:change={(e) => onMinChange(e.detail)}
    />
  </LabeledInput>
</div>

<div class="form-element format">
  Format: <span>{format}</span>
</div>

<style lang="scss">
  .format {
    margin-top: 1rem;
    span {
      padding: 0.3rem 0.5rem;
      border-radius: 0.2rem;
      font-weight: 500;
      background: #efefef;
    }
  }
</style>
