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
  import { Dropdown } from '@mathesar-components';
  import type {
    Appearance,
  } from '@mathesar-components/types';
  import type { SelectOption } from './Select.d';

  const dispatch = createEventDispatcher();
  const selectId: number = getSelectId();

  /**
   * Specifies the key on which the options ID is stored.
   */
  export let idKey = "id";

  /**
   * Specifies the key on which the options label is stored.
   */
  export let labelKey = "label";

  /**
   * List of options to select from. Must be an array of SelectOption.
   * @required
   */
  export let options: SelectOption[] = [];

  /**
   * Currently selected option.
   */
  export let value: SelectOption = null;

  /**
   * Classes to apply to the content (each of the options).
   */
  export let contentClass = "";

  /**
   * Classes to apply to the trigger button (the dropdown button).
   */
  export let triggerClass = "";

  /**
   * Appearance of the trigger button. One of: 'default', 'primary', 'secondary', 'plain', 'ghost'.
   */
  export let triggerAppearance: Appearance = "plain";

  /**
   * The ARIA label for this select component.
   */
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
    if (!value && opts.length > 0) {
      setValue(opts[0]);
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
