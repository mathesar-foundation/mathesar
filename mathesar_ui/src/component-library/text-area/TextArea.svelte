<script lang="ts">
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';

  // Id for the input
  export let id: string = undefined;

  // Disable input
  export let disabled = false;

  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value = '';
</script>

<BaseInput {...$$restProps} bind:id {disabled}/>

<textarea class="input-element text-area" {id} {disabled} bind:value {...$$restProps} />
