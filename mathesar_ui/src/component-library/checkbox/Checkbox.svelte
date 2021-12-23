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
  export let value: string | undefined = undefined;
  export let indeterminate = false;
  export let disabled = false;
  export let label: string | undefined = undefined;

  const componentId = getId();

  function onChange(e: Event) {
    checked = !checked;
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
