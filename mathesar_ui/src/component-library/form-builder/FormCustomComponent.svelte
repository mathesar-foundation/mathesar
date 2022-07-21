<script lang="ts">
  import type {
    FormBuildConfiguration,
    FormStaticElement,
    FormValueStore,
  } from './types';

  export let componentId: FormStaticElement['componentId'];
  export let props: FormStaticElement['props'] = undefined;
  export let stores: FormBuildConfiguration['stores'];
  export let store: FormValueStore;
  export let customComponents: FormBuildConfiguration['customComponents'];
</script>

{#if customComponents?.[componentId]}
  <svelte:component
    this={customComponents[componentId]}
    {...props ?? {}}
    {store}
    {stores}
  />
{/if}
