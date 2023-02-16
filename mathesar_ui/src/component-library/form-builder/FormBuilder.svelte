<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FormElement from './FormElement.svelte';
  import type { FormBuildConfiguration } from './types';

  const dispatch = createEventDispatcher();

  export let disabled = false;
  export let form: FormBuildConfiguration;
  $: validationStore = form.validationStore;

  function submit() {
    dispatch('submit');
    return false;
  }
</script>

<div class="form-builder">
  <form on:submit|preventDefault={submit}>
    <FormElement
      stores={form.stores}
      variables={form.variables}
      element={form.layout}
      customComponents={form.customComponents}
      validationResult={$validationStore}
      {disabled}
    />
  </form>
</div>
