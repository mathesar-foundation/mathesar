<script lang="ts">
  import FormInput from './FormInput.svelte';
  import FormLayout from './FormLayout.svelte';
  import Switch from './Switch.svelte';
  import If from './If.svelte';
  import FormCustomComponent from './FormCustomComponent.svelte';
  import type {
    FormElement,
    FormBuildConfiguration,
    FormValidationResult,
  } from './types';

  export let element: FormElement;
  export let stores: FormBuildConfiguration['stores'];
  export let variables: FormBuildConfiguration['variables'];
  export let customComponents: FormBuildConfiguration['customComponents'];
  export let validationResult: FormValidationResult;

  $: store = 'variable' in element ? stores.get(element.variable) : undefined;
  $: variableType =
    'variable' in element ? variables[element.variable].type : undefined;
</script>

{#if element.type === 'input' && store}
  {#if variableType && variableType !== 'custom'}
    <FormInput
      {...element}
      {...variables[element.variable]}
      type={variableType}
      {store}
      validationErrors={validationResult.failedChecks[element.variable] || []}
    />
  {/if}
{:else if element.type === 'static' && store}
  <FormCustomComponent {...element} {customComponents} {store} {stores} />
{:else if element.type === 'switch' && store}
  <Switch {store} cases={element.cases} let:element={childElement}>
    <svelte:self {...$$props} element={childElement} />
  </Switch>
{:else if element.type === 'if' && store}
  <If {store} {...element} let:element={childElement}>
    <svelte:self {...$$props} element={childElement} />
  </If>
{:else if element.type === 'layout' || !element.type}
  <FormLayout
    orientation={element.orientation}
    elements={element.elements}
    let:element={childElement}
  >
    <svelte:self {...$$props} element={childElement} />
  </FormLayout>
{/if}
