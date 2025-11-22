<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  import {
    type LabelGetter,
    getLabel as defaultGetLabel,
  } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';
  import Render from '@mathesar-component-library-dir/render/Render.svelte';
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';

  import Fieldset from '../fieldset/Fieldset.svelte';
  import type { ComponentWithProps } from '../types';

  type Option = $$Generic;

  export let isInline: boolean | undefined = undefined;
  export let options: readonly Option[] = [];
  export let label: string | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let disabled = false;
  export let labelKey = 'label';
  export let getLabel: LabelGetter<Option> = (o: Option) =>
    defaultGetLabel(o, labelKey);
  export let boxed: boolean | undefined = undefined;
  export let getDisabled: (value: Option | undefined) => boolean = () => false;
  export let getHelp: <C extends SvelteComponent>(
    value: Option,
  ) => string | ComponentWithProps<C> | undefined = () => undefined;
</script>

<Fieldset {ariaLabel} {boxed}>
  <slot name="label" slot="label">{label ?? ''}</slot>
  <ul
    class="fieldset-group-options"
    class:inline={isInline}
    class:has-fieldset-label={!!label}
  >
    {#each options as option (option)}
      {@const help = getHelp(option)}
      <li class="option" class:has-help={!!help}>
        <LabeledInput layout="inline-input-first">
          <StringOrComponent slot="label" arg={getLabel(option)} />
          <slot {option} disabled={getDisabled(option) || disabled} />
          <Render slot="help" arg={help} />
        </LabeledInput>
      </li>
    {/each}
  </ul>
  <slot name="extra" />
</Fieldset>
