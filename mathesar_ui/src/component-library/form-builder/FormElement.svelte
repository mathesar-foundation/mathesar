<script lang="ts">
  import FormInput from './FormInput.svelte';
  import FormLayout from './FormLayout.svelte';
  import Switch from './Switch.svelte';
  import If from './If.svelte';
  import type { FormElement, FormBuildConfiguration } from './types.d';

  export let element: FormElement;
  export let stores: FormBuildConfiguration['stores'];
  export let variables: FormBuildConfiguration['variables'];

  $: store = 'variable' in element ? stores.get(element.variable) : undefined;
</script>

{#if element.type === 'input' && store}
  <FormInput {...element} {...variables[element.variable]} {store} />
{:else if element.type === 'switch' && store}
  <Switch {store} cases={element.cases} let:element={childElement}>
    <svelte:self {variables} {stores} element={childElement} />
  </Switch>
{:else if element.type === 'if' && store}
  <If {store} {...element} let:element={childElement}>
    <svelte:self {variables} {stores} element={childElement} />
  </If>
{:else if element.type === 'layout'}
  <FormLayout
    orientation={element.orientation}
    elements={element.elements}
    let:element={childElement}
  >
    <svelte:self {variables} {stores} element={childElement} />
  </FormLayout>
{/if}
