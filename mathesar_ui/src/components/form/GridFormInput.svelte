<!--
  @component

  @deprecated in favor of components in @mathesar/components/grid-form which
  have looser coupling with the form validation system.
-->
<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  import { Field, type FieldStore } from '@mathesar/components/form';
  import {
    Label,
    LabelController,
    setLabelControllerInContext,
  } from '@mathesar-component-library';
  import type { ComponentWithProps } from '@mathesar-component-library/types';

  import GridFormInputRow from './GridFormInputRow.svelte';

  const labelController = new LabelController();
  $: setLabelControllerInContext(labelController);

  type Value = $$Generic;
  type InputType = $$Generic<SvelteComponent>;

  export let label: string;
  export let help: string | undefined = undefined;
  export let field: FieldStore<Value>;
  export let input: ComponentWithProps<InputType> | undefined = undefined;
  export let bypassRow = false;
</script>

<GridFormInputRow bypass={bypassRow}>
  <div class="left cell">
    <Label controller={labelController}>
      {label}
    </Label>
  </div>

  <div class="right cell">
    <div class="input">
      <Field {field} {input} />
    </div>
    {#if $$slots.help || help}
      <div class="help">
        {#if $$slots.help}
          <slot name="help" />
        {/if}
        {#if help}
          {help}
        {/if}
      </div>
    {/if}
  </div>
</GridFormInputRow>

<style lang="scss">
  .left {
    display: flex;
    align-items: flex-start;
    justify-content: end;
    margin-right: var(--lg1);
    padding-top: var(--sm4);
    margin-left: var(--lg1);
  }

  .help {
    color: var(--neutral-500);
    margin-top: var(--sm6);
    font-size: var(--sm1);
  }
</style>
