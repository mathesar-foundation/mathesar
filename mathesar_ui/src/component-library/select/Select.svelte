<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { Dropdown } from '@mathesar-component-library';
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import { getLabel as defaultGetLabel } from '@mathesar-component-library-dir/common/utils/formatUtils';
  import type { Appearance } from '@mathesar-component-library/types';

  const dispatch = createEventDispatcher();

  type Option = $$Generic;

  export let id: string | undefined = undefined;

  export let disabled = false;

  /**
   * Specifies the key on which the options label is stored.
   */
  export let labelKey = 'label';

  /**
   * List of options to select from. Must be an array of SelectOption.
   * @required
   */
  export let options: Option[] = [];

  export let value: Option | undefined = undefined;

  /**
   * Classes to apply to the content (each of the options).
   */
  export let contentClass = '';

  /**
   * Classes to apply to the trigger button (the dropdown button).
   */
  export let triggerClass = '';

  /**
   * Appearance of the trigger button. One of: 'default', 'primary', 'secondary', 'plain', 'ghost'.
   */
  export let triggerAppearance: Appearance = 'plain';

  /**
   * The ARIA label for this select component.
   */
  export let ariaLabel: string | undefined = undefined;

  export let getLabel: (value: Option, labelKey?: string) => string =
    defaultGetLabel;

  /**
   * By default, options will be compared by equality. If you're using objects as
   * options, you can supply a custom function here to compare them.
   *
   * For example:
   *
   * ```ts
   * valuesAreEqual={(a, b) => a.id === b.id}
   * ```
   */
  export let valuesAreEqual: (
    optionToCompare: Option,
    selectedOption: Option | undefined,
  ) => boolean = (a, b) => a === b;

  let isOpen = false;
  let currentIndex = 0;
  let parentHoverElem: HTMLElement;

  function setValue(opt?: Option) {
    value = opt;
    dispatch('change', value);
    isOpen = false;
  }

  function setOptions(opts: Option[]) {
    if (opts.length > 0) {
      if (!value) {
        setValue(opts[0]);
      } else if (!opts.find((entry) => value && valuesAreEqual(entry, value))) {
        setValue(opts[0]);
      }
    } else {
      setValue(undefined);
    }
  }

  function scrollBehavior(): void {
    if (parentHoverElem) {
      const hoveredElem: HTMLElement | null =
        parentHoverElem.querySelector('.hovered');
      const container = parentHoverElem.parentElement as HTMLDivElement;
      if (hoveredElem && container) {
        if (
          hoveredElem.offsetTop + hoveredElem.clientHeight >
          container.scrollTop + container.clientHeight
        ) {
          const offsetValue: number =
            container.getBoundingClientRect().bottom -
            hoveredElem.getBoundingClientRect().bottom;
          container.scrollTop -= offsetValue;
        } else if (hoveredElem.offsetTop < container.scrollTop) {
          container.scrollTop = hoveredElem.offsetTop;
        }
      }
    }
  }

  function setSelectedItem() {
    const index = options.findIndex((opt) => valuesAreEqual(opt, value));
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
          setValue(options[currentIndex]);
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

<BaseInput {...$$restProps} bind:id {disabled} />

<Dropdown
  ariaControls="{id}-select-options"
  {ariaLabel}
  bind:isOpen
  {disabled}
  {id}
  contentClass="select {contentClass}"
  {triggerAppearance}
  {triggerClass}
  on:keydown={keyAccessibility}
  on:open={setSelectedItem}
>
  <svelte:fragment slot="trigger">
    {#if typeof value !== 'undefined'}
      {getLabel(value, labelKey)}
    {:else}
      No option selected
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="content">
    <ul
      bind:this={parentHoverElem}
      id="{id}-select-options"
      tabindex="0"
      role="listbox"
      aria-expanded="true"
    >
      {#each options as option (option)}
        <li
          role="option"
          class:selected={value && valuesAreEqual(option, value)}
          class:hovered={valuesAreEqual(option, options[currentIndex])}
          on:click={() => setValue(option)}
        >
          <span>{getLabel(option, labelKey)}</span>
        </li>
      {/each}
    </ul>
  </svelte:fragment>
</Dropdown>
