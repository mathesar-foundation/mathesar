<script lang="ts">
  import type { ComponentProps, ComponentType, SvelteComponent } from 'svelte';

  import { LabeledInput, TextInput } from '@mathesar-component-library';
  import type { FieldStore } from './field';
  import FieldErrors from './FieldErrors.svelte';
  import FieldLayout from './FieldLayout.svelte';

  type Layout = ComponentProps<LabeledInput>['layout'];
  type Value = $$Generic;
  type InputType = $$Generic<SvelteComponent>;

  // TODO replace this with the shared version of `ComponentAndProps` once we
  // refactor that type to be generic.
  type ComponentAndProps<T extends SvelteComponent> = {
    component: ComponentType<T>;
    props?: ComponentProps<T>;
  };

  export let field: FieldStore<Value>;
  export let input: ComponentAndProps<InputType> | undefined = undefined;
  export let label: string | undefined = undefined;
  export let help: string | undefined = undefined;
  export let layout: Layout | undefined = undefined;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  $: inputComponent = input?.component ?? (TextInput as typeof SvelteComponent);
  $: inputComponentProps = input?.props ?? {};
  $: ({ showsError } = field);
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
        {...inputComponentProps}
      />
    </LabeledInput>
  {:else}
    <svelte:component
      this={inputComponent}
      bind:value={$field}
      hasError={$showsError}
      {...inputComponentProps}
    >
      <slot />
    </svelte:component>
  {/if}
  <FieldErrors {field} />
</FieldLayout>
