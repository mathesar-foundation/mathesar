<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  import type { LabelGetter } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import { getLabel as defaultGetLabel } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';
  import StringOrComponentTyped from '@mathesar-component-library-dir/string-or-component/StringOrComponentTyped.svelte';
  import type { ComponentWithProps } from '../types';

  type Option = $$Generic;

  export let isInline = false;
  export let options: readonly Option[] = [];
  export let label: string | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let disabled = false;
  export let labelKey = 'label';
  export let getLabel: LabelGetter<Option> = (o: Option) =>
    defaultGetLabel(o, labelKey);
  export let boxed = false;
  export let getDisabled: (value: Option | undefined) => boolean = () => false;
  export let getHelp: <C extends SvelteComponent>(
    value: Option,
  ) => string | ComponentWithProps<C> | undefined = () => undefined;
</script>

<fieldset
  class="fieldset-group"
  class:inline={isInline}
  class:boxed
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
      {@const help = getHelp(option)}
      <li class="option" class:has-help={!!help}>
        <LabeledInput layout="inline-input-first">
          <svelte:fragment slot="label">
            <StringOrComponent arg={getLabel(option)} />
          </svelte:fragment>
          <slot {option} disabled={getDisabled(option) || disabled} />
          <svelte:fragment slot="help">
            {#if help}
              <StringOrComponentTyped arg={help} />
            {/if}
          </svelte:fragment>
        </LabeledInput>
      </li>
    {/each}
  </ul>
  <slot name="extra" />
</fieldset>
