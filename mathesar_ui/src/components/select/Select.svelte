<script lang="typescript" context="module">
  let id = 0;

  export function getSelectId(): number {
    id += 1;
    return id;
}
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Dropdown } from '@mathesar-components';
  import type { SelectOption } from './Select.d';

  const dispatch = createEventDispatcher();
  const selectId: number = getSelectId() as number;

  export let idKey = 'id';
  export let labelKey = 'label';
  export let options: SelectOption[] = [];
  export let value: SelectOption = null;
  export let contentClass = '';
  export let triggerClass = '';

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

<Dropdown bind:isOpen contentClass="select {contentClass}" {triggerClass}>
  <svelte:fragment slot="trigger">
    {value?.[labelKey]}
  </svelte:fragment>
  
  <svelte:fragment slot="content">
    <ul id="select-value-{selectId}" tabindex="0" role="listbox" aria-expanded="true">
      {#each options as option (option[idKey])}
        <li class:selected={option[idKey] === value[idKey]}
            on:click={() => setValue(option)}>
          <span>{option[labelKey]}</span>
        </li>
      {/each}
    </ul>
  </svelte:fragment>
</Dropdown>

<style global lang="scss">
  @import "Select.scss";
</style>
