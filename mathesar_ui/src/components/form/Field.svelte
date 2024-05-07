<script lang="ts">
  import type { ComponentProps, SvelteComponent } from 'svelte';

  import { LabeledInput, TextInput } from '@mathesar-component-library';
  import type { ComponentWithProps } from '@mathesar-component-library/types';

  import type { FieldStore } from './field';
  import FieldErrors from './FieldErrors.svelte';
  import FieldHelp from './FieldHelp.svelte';
  import FieldLayout from './FieldLayout.svelte';

  type Layout = ComponentProps<LabeledInput>['layout'];
  type Value = $$Generic;
  type InputType = $$Generic<SvelteComponent>;

  export let field: FieldStore<Value>;
  export let input: ComponentWithProps<InputType> | undefined = undefined;
  export let label: string | undefined = undefined;
  export let help: string | undefined = undefined;
  export let layout: Layout | undefined = undefined;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  $: inputComponent = input?.component ?? (TextInput as typeof SvelteComponent);
  $: inputComponentProps = input?.props ?? {};
  $: ({ showsError, disabled } = field);
</script>

<FieldLayout>
  {#if label || $$slots.label}
    <LabeledInput {label} {layout} {help}>
      <slot name="label" slot="label" />
      <slot name="help" slot="help" />
      <svelte:component
        this={inputComponent}
        bind:value={$field}
        hasError={$showsError}
        disabled={$disabled}
        {...inputComponentProps}
      />
    </LabeledInput>
  {:else}
    <svelte:component
      this={inputComponent}
      bind:value={$field}
      hasError={$showsError}
      disabled={$disabled}
      {...inputComponentProps}
    >
      <slot />
    </svelte:component>
    {#if help || $$slots.help}
      <FieldHelp>
        <slot name="help">{help}</slot>
      </FieldHelp>
    {/if}
  {/if}
  <FieldErrors {field} />
</FieldLayout>
