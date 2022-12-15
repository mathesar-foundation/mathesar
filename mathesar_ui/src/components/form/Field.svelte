<script lang="ts">
  import type { ComponentProps, ComponentType, SvelteComponent } from 'svelte';

  import { TextInput, type LabeledInput } from '@mathesar-component-library';
  import type { FieldStore } from './field';
  import FieldWrapper from './FieldWrapper.svelte';
  import FieldErrors from './FieldErrors.svelte';

  type Layout = ComponentProps<LabeledInput>['layout'];
  type Value = $$Generic;
  type InputType = $$Generic<SvelteComponent>;

  // TODO replace this with the shared version of `ComponentAndProps` once we
  // refactor that type to be generic.
  type ComponentAndProps<T extends SvelteComponent> = {
    component: ComponentType<T>;
    props: ComponentProps<T>;
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

<span class="field">
  <FieldWrapper {label} {layout} {help}>
    <slot name="help" slot="help" />
    <svelte:component
      this={inputComponent}
      bind:value={$field}
      hasError={$showsError}
      {...inputComponentProps}
    />
  </FieldWrapper>
  <FieldErrors {field} />
</span>

<style>
  .field {
    display: block;
    --spacing: 1rem;
  }
  :global(.field + .field) {
    margin-top: var(--spacing);
  }
</style>
