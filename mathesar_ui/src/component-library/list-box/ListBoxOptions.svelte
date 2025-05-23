<script lang="ts">
  import { getContext, onMount, tick } from 'svelte';

  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';

  import type { ListBoxContext } from './ListBoxTypes';

  type Option = $$Generic;

  export let id: string;
  let classes = '';
  export { classes as class };
  export let truncateOnOverflow = true;
  /**
   * This prop determines the additional offset (in px)
   * that needs to be taken into account while focusing
   * an option.
   */
  export let offsetOnFocus = 0;

  const { api, state } = getContext<ListBoxContext<Option>>('LIST_BOX_CONTEXT');
  const { displayedOptions, value, focusedOptionIndex, staticProps } = state;

  let listBoxElement: HTMLUListElement;

  function scrollToFocusedItem(): void {
    if (listBoxElement) {
      const elementInFocus: HTMLElement | null =
        listBoxElement.querySelector('.in-focus');
      const container =
        $staticProps.mode === 'dropdown'
          ? (listBoxElement.parentElement as HTMLElement)
          : listBoxElement;
      if (elementInFocus && container) {
        if (
          elementInFocus.offsetTop +
            elementInFocus.clientHeight +
            offsetOnFocus >
          container.scrollTop + container.clientHeight
        ) {
          const offsetValue: number =
            container.getBoundingClientRect().bottom -
            elementInFocus.getBoundingClientRect().bottom -
            offsetOnFocus * 2;
          container.scrollTop -= offsetValue;
        } else if (elementInFocus.offsetTop < container.scrollTop) {
          container.scrollTop = elementInFocus.offsetTop - offsetOnFocus;
        }
      }
    }
  }

  onMount(() => {
    scrollToFocusedItem();

    return focusedOptionIndex.subscribe(() => {
      void tick().then(() => scrollToFocusedItem());
    });
  });
</script>

<ul
  bind:this={listBoxElement}
  tabindex="0"
  {id}
  role="listbox"
  aria-expanded="true"
  class:truncate={truncateOnOverflow}
  class:disabled={$staticProps.disabled}
  class={['list-box-options', $staticProps.selectionType, classes].join(' ')}
  on:focus
  on:blur
  on:keydown
>
  {#each $displayedOptions as option, index (option)}
    {@const isSelected = $value.some((opt) =>
      $staticProps.checkEquality(opt, option),
    )}
    {@const isDisabled = $staticProps.checkIfOptionIsDisabled(option)}
    <li
      role="option"
      class:selected={isSelected}
      class:disabled={isDisabled}
      class:in-focus={index === $focusedOptionIndex}
      aria-selected={isSelected ? true : undefined}
      on:click={() => api.pick(option)}
    >
      <slot {option} label={$staticProps.getLabel(option)}>
        <StringOrComponent arg={$staticProps.getLabel(option)} />
      </slot>
    </li>
  {/each}
</ul>
