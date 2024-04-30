<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { LabeledInput, Select } from '@mathesar-component-library';
  import type { DurationUnit } from '@mathesar/api/rest/types/tables/columns';
  import type { DurationConfig } from '@mathesar/utils/duration/types';
  import type { FormValues } from '@mathesar-component-library/types';
  import { DurationSpecification } from '@mathesar/utils/duration';
  import { RichText } from '@mathesar/components/rich-text';

  interface DurationFormValues extends FormValues, DurationConfig {}

  export let store: Writable<DurationFormValues>;

  const options: DurationUnit[] = DurationSpecification.getAllUnits();
  const labels: Record<DurationUnit, string> = {
    d: $_('days'),
    h: $_('hours'),
    m: $_('minutes'),
    s: $_('seconds'),
    ms: $_('milliseconds'),
  };
  const getLabel = (opt?: DurationUnit) => (opt && labels[opt]) ?? '';

  $: format = new DurationSpecification($store).getFormattingString();

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
  <LabeledInput label={$_('max_time_unit')} layout="stacked">
    <Select
      {options}
      value={$store.max}
      {getLabel}
      on:change={(e) => onMaxChange(e.detail)}
    />
  </LabeledInput>
</div>

<div class="form-element form-input">
  <LabeledInput label={$_('min_time_unit')} layout="stacked">
    <Select
      {options}
      value={$store.min}
      {getLabel}
      on:change={(e) => onMinChange(e.detail)}
    />
  </LabeledInput>
</div>

<div class="form-element format">
  <RichText text={$_('format_displayer')} let:slotName>
    {#if slotName === 'format'}
      <span>{format}</span>
    {/if}
  </RichText>
</div>

<style lang="scss">
  .format {
    margin-top: 1rem;
    span {
      padding: 0.3rem 0.5rem;
      border-radius: 0.2rem;
      font-weight: 500;
      background: var(--slate-100);
    }
  }
</style>
