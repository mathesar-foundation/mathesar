<script lang="ts">
  // This component is to be used where column specific input is required
  // Eg., while filtering, grouping, setting default value etc.,
  // This is not part of the cell but placed here since most utilities are
  // shared. Will require a re-organization during Sheet component creation.
  import type {
    ComponentAndProps,
    BaseInputProps,
    SimplifiedInputProps,
  } from '@mathesar-component-library/types';
  import { getDbTypeBasedInputCap } from './utils';
  import type { CellColumnLike } from './data-types/typeDefinitions';

  // TODO: Provide this as a discrimated union of all input types
  interface StaticProps
    extends BaseInputProps,
      Omit<SimplifiedInputProps, 'value'> {
    value: unknown;
    hasError?: boolean;
  }
  type $$Props = StaticProps &
    (
      | {
          column: CellColumnLike;
        }
      | {
          componentAndProps: ComponentAndProps<unknown>;
        }
    );

  export let column: CellColumnLike | undefined = undefined;
  export let value: unknown;
  export let componentAndProps = column && getDbTypeBasedInputCap(column);
</script>

{#if componentAndProps}
  <svelte:component
    this={componentAndProps.component}
    {...$$restProps}
    {...componentAndProps.props}
    bind:value
    on:input
    on:change
    on:focus
    on:blur
  />
{/if}
