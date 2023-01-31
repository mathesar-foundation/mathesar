<script lang="ts">
  import type { SvelteComponent } from 'svelte';
  import {
    Label,
    LabelController,
    setLabelControllerInContext,
  } from '@mathesar-component-library';
  import { Field, type FieldStore } from '@mathesar/components/form';
  import type { ComponentWithProps } from '@mathesar-component-library/types';
  import UserFormInputRow from './UserFormInputRow.svelte';

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

<UserFormInputRow bypass={bypassRow}>
  <div class="left cell">
    <Label controller={labelController}>
      {label}
    </Label>
  </div>

  <div class="right cell">
    <div class="input">
      <Field {field} {input} />
    </div>
    {#if help}
      <div class="help">
        {help}
      </div>
    {/if}
  </div>
</UserFormInputRow>

<style lang="scss">
  .left {
    display: flex;
    align-items: flex-start;
    justify-content: end;
    margin-right: var(--size-large);
    padding-top: var(--size-ultra-small);
  }
</style>
