<!--
@component

This component is to be used where column specific input is required e.g. while
filtering, grouping, setting default value etc. This is not part of the cell but
placed here since most utilities are shared. Will require a re-organization
during Sheet component creation.
-->
<script lang="ts">
  import type {
    ComponentAndProps,
    BaseInputProps,
    SimplifiedInputProps,
  } from '@mathesar-component-library/types';

  // TODO: Provide this as a discriminated union of all input types
  interface $$Props
    extends BaseInputProps,
      Omit<SimplifiedInputProps, 'value'> {
    value: unknown;
    hasError?: boolean;
    componentAndProps: ComponentAndProps;

    /**
     * From `LinkedRecordInput`. Perhaps there's a better way to specify this
     * property here.
     */
    containerClass?: string;
  }

  export let value: unknown;
  export let componentAndProps: ComponentAndProps;

  // TODO write more comments explaining this
  $: props = componentAndProps.props as Record<string, unknown>;
</script>

<svelte:component
  this={componentAndProps.component}
  {...$$restProps}
  {...props}
  {value}
  on:input
  on:artificialInput
  on:change
  on:artificialChange
  on:focus
  on:blur
  on:recordSelectorOpen
  on:recordSelectorCancel
  on:recordSelectorSubmit
/>
