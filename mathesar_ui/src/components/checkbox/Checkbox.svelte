<script context="module" lang="ts">
  let id = 0;

  function getId() {
    id += 1;
    return id;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let checked = false;
  export let group = [];
  export let value = null;
  export let indeterminate = false;
  export let disabled = false;
  export let label: string = null;

  const componentId = getId();

  function onChange(e: Event) {
    dispatch('change', {
      checked,
      originalEvent: e,
    });
  }
</script>

<label class="checkbox" for="checkbox-{componentId}"
        class:checked class:indeterminate class:disabled>
  <span class="wrapper">
    <input type="checkbox" id="checkbox-{componentId}"
            bind:checked bind:group
            {indeterminate} {disabled} {value}
            on:change={onChange}/>
    <span class="alias"></span>
  </span>

  {#if label}
    <span class="label">{label}</span>
  {/if}
</label>

<style global lang="scss">
  @import "Checkbox.scss";
</style>
