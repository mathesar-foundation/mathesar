<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Dropdown } from '@mathesar-components';
  import type { SelectOption } from './Select.d';

  const dispatch = createEventDispatcher();

  export let idKey = 'id';
  export let labelKey = 'label';
  export let options: SelectOption[] = [];
  export let value: SelectOption = null;

  let isOpen = false;

  function setValue(opt: SelectOption) {
    value = opt;
    dispatch('change', {
      value,
    });
    isOpen = false;
  }

  function setOptions(opts: SelectOption[]) {
    if (!value && opts.length > 0) {
      setValue(opts[0]);
    }
  }

  $: setOptions(options);
</script>

<Dropdown bind:isOpen contentClass="select">
  <svelte:fragment slot="trigger">
    {value?.[labelKey]}
  </svelte:fragment>
  
  <svelte:fragment slot="content">
    <ul>
      {#each options as option (option[idKey])}
        <li class:selected={option === value} on:click={() => setValue(option)}>
          <span>{option[labelKey]}</span>
        </li>
      {/each}
    </ul>
  </svelte:fragment>
</Dropdown>

<style global lang="scss">
  @import "Select.scss";
</style>
