<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FormElement from './FormElement.svelte';
  import type { FormBuildConfiguration } from './types';

  const dispatch = createEventDispatcher();

  export let form: FormBuildConfiguration;
  $: validationStore = form.validation;

  function submit() {
    dispatch('submit');
    return false;
  }
</script>

<div class="form-builder">
  <form on:submit|preventDefault={submit}>
    <FormElement
      stores={form.stores}
      storeUsage={form.storeUsage}
      variables={form.variables}
      element={form.layout}
      validationResult={$validationStore}
    />
  </form>
</div>
