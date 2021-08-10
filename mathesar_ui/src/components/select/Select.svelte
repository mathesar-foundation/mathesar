<script lang="typescript" context="module">
  let id = 0;

  export function getSelectId(): number {
    id += 1;
    return id;
  }
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Dropdown } from '@mathesar-components';
  import type { SelectOption } from './Select.d';

  const dispatch = createEventDispatcher();
  const selectId: number = getSelectId();

  export let idKey = 'id';
  export let labelKey = 'label';
  export let options: SelectOption[] = [];
  export let value: SelectOption = null;
  export let contentClass = '';
  export let triggerClass = '';
  export let ariaLabel: string = null;


  let isOpen = false;
  let currentIndex = 0;
  let erasedIndex = 0;
  let t = 0;

  function setValue(opt: SelectOption) {
    value = opt;
    dispatch('change', {
      value,
    });
    isOpen = false;
    erasedIndex = 0;
    currentIndex = 0;
  }
  
  function setOptions(opts: SelectOption[]) {
    if (!value && opts.length > 0) {
      setValue(opts[0]);
    }
  }
  
  function hoveredItem(index){
      let items= [...document.getElementById('select-value-'+selectId).getElementsByTagName('li')];
      if(currentIndex == items.length - 1 && index > 0){
        currentIndex = 0;
        index = 0;
      }else if(currentIndex == 0 && index < 0){
        currentIndex = items.length;
      }else if(currentIndex == 0 && index > 0){
        if(t <1){
          currentIndex = -1;
        }else if (t > 1){
          currentIndex = 0;
        }
        t += 1; 
      }
      if(erasedIndex >= 1){
        let hoveredElement= document.querySelector(".hovered");
        hoveredElement.classList.remove("hovered");
      }
      currentIndex = currentIndex + index; 
      items[currentIndex].classList.add("hovered");
      erasedIndex = 1; 
    }

  function keyAccessibility(e){
      switch (e.key){
        case "ArrowDown":
          hoveredItem(1);
          break;
        case "ArrowUp":
          hoveredItem(-1);
          break;
        case "Escape":
          isOpen = false;
          break;
        case "Enter":
          if (options.length == 0) break;
          setValue(options[currentIndex]);
          break;
    }
    }
  $: setOptions(options); 
</script>
<Dropdown ariaControls="select-value-{selectId}" {ariaLabel} bind:isOpen contentClass="select {contentClass}" {triggerClass} on:keydown={keyAccessibility}>
  <svelte:fragment slot="trigger">
    {value?.[labelKey]}
  </svelte:fragment>
  
  <svelte:fragment slot="content">
    <ul id="select-value-{selectId}" tabindex="0" role="listbox" aria-expanded="true">
      {#each options as option (option[idKey])}
        <li role='option' class:selected={option[idKey] === value[idKey]} on:click={() => setValue(option)}>
          <span>{option[labelKey]}</span>
        </li>
      {/each}
    </ul>
  </svelte:fragment>
</Dropdown>

<style global lang="scss">
  @import "Select.scss";
</style>
