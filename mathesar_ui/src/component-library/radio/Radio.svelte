<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';

  const dispatch = createEventDispatcher<{ change: boolean }>();

  export let checked = false;
  export let value: string | number | string[] | undefined = undefined;
  export let disabled = false;
  export let id: string | undefined = undefined;

  function handleChange() {
    checked = !checked;
    dispatch('change', checked);
  }
</script>

<BaseInput {...$$restProps} bind:id {disabled} />

<input
  class="radio"
  type="radio"
  {checked}
  {id}
  {disabled}
  {value}
  on:change={handleChange}
/>
