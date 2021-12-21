<script lang="ts">
  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value = '';
</script>

<textarea class="text-area" bind:value {...$$restProps} />
