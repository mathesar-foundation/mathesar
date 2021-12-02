<script lang='ts'>
  import { createEventDispatcher } from 'svelte';
  import FormLayout from './FormLayout.svelte';
  import type { FormBuildConfiguration } from './types.d';

  const dispatch = createEventDispatcher();

  export let form: FormBuildConfiguration;

  function submit() {
    dispatch('submit');
    return false;
  }
</script>

<div class="form">
  <form on:submit|preventDefault={submit}>
    <FormLayout {...form}/>
  </form>
</div>
