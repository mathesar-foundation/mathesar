<script context="module" lang="ts">
  let maxId = 0;

  function getId() {
    maxId += 1;
    return maxId;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let checked = false;
  export let value = null;
  export let indeterminate = false;
  export let disabled = false;
  export let label: string = null;
  export let id = `checkbox-${getId()}`;

  function onChange(e: Event) {
    checked = !checked;
    dispatch('change', {
      checked,
      originalEvent: e,
    });
  }
</script>

<label class="checkbox" for={id}
        class:checked class:indeterminate class:disabled>
  <span class="wrapper">
    <input type="checkbox" id={id}
            checked={checked}
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
