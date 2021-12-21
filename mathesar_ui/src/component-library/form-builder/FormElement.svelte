<script lang='ts'>
  import FormInput from './FormInput.svelte';
  import FormLayout from './FormLayout.svelte';
  import Switch from './Switch.svelte';
  import If from './If.svelte';

  export let element;
  export let stores;
  export let variables;
</script>

{#if element.type === 'input'}
  <FormInput {...element} {...variables[element.variable]}
    store={stores[element.variable]}/>

{:else if element.type === 'switch'}
  <Switch store={stores[element.switch]}
    cases={element.cases} let:element={childElement}>
      <svelte:self {variables} {stores} element={childElement}/>
  </Switch>

{:else if element.type === 'if'}
  <If store={stores[element.if]} {...element} let:element={childElement}>
    <svelte:self {variables} {stores} element={childElement}/>
  </If>

{:else if element.type === 'layout' || !element.type}
  <FormLayout orientation={element.orientation}
    elements={element.elements} let:element={childElement}>
      <svelte:self {variables} {stores} element={childElement}/>
  </FormLayout>
{/if}
