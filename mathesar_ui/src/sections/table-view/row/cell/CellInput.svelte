<script lang="ts">
  import { onMount } from 'svelte';

  export let isNullDisplayed = false;
  export let value: unknown = undefined;

  let inputRef: HTMLInputElement;

  onMount(() => {
    inputRef.focus();
  });
</script>

<input
  bind:this={inputRef}
  type="text"
  class="edit-input-box"
  class:is-null-displayed={isNullDisplayed}
  value={typeof value === 'string' || typeof value === 'number' ? value : ''}
  on:keydown
  on:keyup
  on:blur
  on:input
/>
