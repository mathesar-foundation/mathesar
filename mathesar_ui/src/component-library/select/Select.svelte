<script lang="typescript" context="module">
  let id = 0;

  export function getSelectId(): number {
    id += 1;
    return id;
  }
</script>

<script lang="ts">
  import {
    createEventDispatcher,
    tick,
  } from 'svelte';
  import { Dropdown } from '@mathesar-component-library';
  import type {
    Appearance,
  } from '@mathesar-component-library/types';
  import type { SelectOption } from './Select.d';

  const dispatch = createEventDispatcher();
  const selectId: number = getSelectId();

  export let idKey = 'id';
  export let labelKey = 'label';
  export let options: SelectOption[] = [];
  export let value: SelectOption = null;
  export let contentClass = '';
  export let triggerClass = '';
  export let triggerAppearance: Appearance = 'plain';
  export let ariaLabel: string = null;

  let isOpen = false;
  let currentIndex = 0;
  let parentHoverElem: HTMLElement;

  function setValue(opt: SelectOption) {
    value = opt;
    dispatch('change', {
      value,
    });
    isOpen = false;
  }
  
  function setOptions(opts: SelectOption[]) {
    if (opts.length > 0) {
      if (!value) {
        setValue(opts[0]);
      } else if (!opts.find((entry) => entry[idKey] === value[idKey])) {
        setValue(opts[0]);
      }
    } else {
      setValue(null);
    }
  }

  function scrollBehavior(): void {
    if (parentHoverElem) {
      const hoveredElem: HTMLElement = parentHoverElem.querySelector('.hovered');
      const container = parentHoverElem.parentElement as HTMLDivElement;
      if (hoveredElem && container) {
        if (hoveredElem.offsetTop + hoveredElem.clientHeight
         > (container.scrollTop + container.clientHeight)) {
          const offsetValue: number = container.getBoundingClientRect().bottom
            - hoveredElem.getBoundingClientRect().bottom;
          container.scrollTop -= offsetValue;
        } else if (hoveredElem.offsetTop < container.scrollTop) {
          container.scrollTop = hoveredElem.offsetTop;
        }
      }
    }
  }

  function setSelectedItem() {
    const index = options.findIndex((e) => e[idKey] === value?.[idKey]);
    if (index > -1) {
      currentIndex = index;
    }
  }

  async function hoveredItem(index: number): Promise<void> {
    if (currentIndex === options.length - 1 && index > 0) {
      currentIndex = 0;
    } else if (currentIndex === 0 && index < 0) {
      currentIndex = options.length - 1;
    } else {
      currentIndex += index;
    }
    await tick();
    scrollBehavior();
  }

  function keyAccessibility(e: KeyboardEvent): void {
    if (isOpen) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          void hoveredItem(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          void hoveredItem(-1);
          break;
        case 'Escape':
          e.preventDefault();
          isOpen = false;
          break;
        case 'Enter':
          e.preventDefault();
          if (options.length === 0) break;
          value = options[currentIndex];
          dispatch('change', {
            value,
          });
          isOpen = !isOpen;
          break;
        default:
          break;
      }
    } else {
      switch (e.key) {
        case 'Enter':
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault();
          isOpen = true;
          break;
        default:
          break;
      }
    }
  }

  $: setOptions(options);
</script>
<Dropdown ariaControls="select-value-{selectId}" {ariaLabel} bind:isOpen 
          contentClass="select {contentClass}" {triggerAppearance} {triggerClass} 
          on:keydown={keyAccessibility} on:open={setSelectedItem}>
  <svelte:fragment slot="trigger">
    {value?.[labelKey]}
  </svelte:fragment>
  
  <svelte:fragment slot="content">
    <ul bind:this={parentHoverElem} id="select-value-{selectId}" tabindex="0" role="listbox" aria-expanded="true">
      {#each options as option (option[idKey])}
        <li role='option' class:selected={option[idKey] === value[idKey]} class:hovered={option[idKey] === options[currentIndex]?.[idKey]} on:click={() => setValue(option)}>
          <span>{option[labelKey]}</span>
        </li>
      {/each}
    </ul>
  </svelte:fragment>
</Dropdown>

<style global lang="scss">
  @import "Select.scss";
</style>
