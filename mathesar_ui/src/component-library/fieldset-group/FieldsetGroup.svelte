<script lang="ts">
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';
  import type { LabelGetter } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import { getLabel as defaultGetLabel } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';

  type Option = $$Generic;

  export let isInline = false;
  export let options: Option[] = [];
  export let label: string | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;

  export let labelKey = 'label';
  export let getLabel: LabelGetter<Option> = (o: Option) =>
    defaultGetLabel(o, labelKey);

  export let getDisabled: (value: Option | undefined) => boolean = () => false;
</script>

<fieldset
  class="fieldset-group"
  class:inline={isInline}
  class:has-label={!!label}
  aria-label={ariaLabel}
  on:change
>
  {#if $$slots.label || label}
    <legend>
      {#if $$slots.label}<slot name="label" />{/if}
      {#if label}{label}{/if}
    </legend>
  {/if}
  <ul class="options">
    {#each options as option (option)}
      <li class="option">
        <LabeledInput layout="inline-input-first">
          <svelte:fragment slot="label">
            <StringOrComponent arg={getLabel(option)} />
          </svelte:fragment>
          <slot {option} disabled={getDisabled(option)} />
        </LabeledInput>
      </li>
    {/each}
  </ul>
</fieldset>
