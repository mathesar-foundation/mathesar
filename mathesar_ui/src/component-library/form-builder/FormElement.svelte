<script lang="ts">
  import FormInput from './FormInput.svelte';
  import FormLayout from './FormLayout.svelte';
  import Switch from './Switch.svelte';
  import If from './If.svelte';
  import type { FormElement, FormBuildConfiguration } from './types.d';

  export let element: FormElement;
  export let stores: FormBuildConfiguration['stores'];
  export let variables: FormBuildConfiguration['variables'];
</script>

{#if element.type === 'input'}
  <FormInput {...element} {...variables[element.variable]}
    store={stores.get(element.variable)}/>

{:else if element.type === 'switch'}
  <Switch store={stores.get(element.variable)}
    cases={element.cases} let:element={childElement}>
      <svelte:self {variables} {stores} element={childElement}/>
  </Switch>
{:else if element.type === 'if'}
  <If store={stores.get(element.variable)} {...element} let:element={childElement}>
    <svelte:self {variables} {stores} element={childElement}/>
  </If>
{:else}
  <FormLayout
    orientation={element.orientation}
    elements={element.elements}
    let:element={childElement}
  >
    <svelte:self {variables} {stores} element={childElement} />
  </FormLayout>
{/if}
