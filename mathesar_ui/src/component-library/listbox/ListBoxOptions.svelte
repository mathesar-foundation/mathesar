<script lang="ts">
  import { getContext } from 'svelte';
  import type { ListBoxContext } from './ListBoxTypes';

  type Option = $$Generic;

  export let id: string;

  const { api, state } = getContext<ListBoxContext<Option>>('LISTBOX_CONTEXT');
  const { displayedOptions, value, focusedOptionIndex, staticProps } = state;
</script>

<ul tabindex="0" {id} role="listbox" aria-expanded="true">
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
