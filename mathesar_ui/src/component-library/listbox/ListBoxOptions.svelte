<script lang="ts">
  import { getContext } from 'svelte';
  import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';
  import type { ListBoxContext } from './ListBoxTypes';

  type Option = $$Generic;

  export let trigger: HTMLElement | undefined = undefined;

  const { api, state } = getContext<ListBoxContext<Option>>('LISTBOX_CONTEXT');
  const { isOpen, displayedOptions, value, focusedOptionIndex, staticProps } =
    state;
</script>

<AttachableDropdown {trigger} isOpen={$isOpen} on:close={() => api.close()}>
  <ul tabindex="0" role="listbox" aria-expanded="true">
    {#each $displayedOptions as option, index (option)}
      <li
        role="option"
        class:selected={$value.some((opt) =>
          $staticProps.checkEquality(opt, option),
        )}
        class:hovered={index === $focusedOptionIndex}
        on:click={() => api.select(option)}
      >
        <span>{$staticProps.getLabel(option, $staticProps.labelKey)}</span>
      </li>
    {/each}
  </ul>
</AttachableDropdown>
