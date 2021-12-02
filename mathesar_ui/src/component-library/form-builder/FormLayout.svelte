<script lang='ts'>
  import FormInput from './FormInput.svelte';

  export let variables;
  export let stores;
  export let layout;
</script>

<div class='form-layout {layout.orientation}'>
  {#each layout.elements as element (element)}
    {#if element.type === 'input'}
      <FormInput {...element} {...variables[element.variable]}
        store={stores[element.variable]}/>
    {:else if element.type === 'layout'}
      <svelte:self {variables} {stores} layout={element}/>
    {/if}
  {/each}
</div>
