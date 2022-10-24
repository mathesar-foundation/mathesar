<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { Icon } from '@mathesar-component-library';
  import { iconLinkToRecordPage, iconPickRecord } from '@mathesar/icons';
  import type { RecordSelectorPurpose } from './recordSelectorUtils';

  const dispatch = createEventDispatcher();

  export let purpose: RecordSelectorPurpose;
  export let isSelected: boolean;

  $: icon = purpose === 'dataEntry' ? iconPickRecord : iconLinkToRecordPage;
  $: phrase = purpose === 'dataEntry' ? 'Pick' : 'Open';
  $: element = purpose === 'dataEntry' ? 'button' : 'div';

  function handleClick() {
    if (purpose === 'dataEntry') {
      dispatch('click');
    }
  }
</script>

<svelte:element
  this={element}
  class="submit passthrough"
  class:selected={isSelected}
  on:click={handleClick}
>
  <span class="icon">
    <Icon {...icon} />
  </span>
  <span class="label">
    {phrase}
  </span>
</svelte:element>

<style>
  .submit {
    display: inline-flex;
    align-items: center;
    border-radius: 0.2rem;
    background: var(--color-gray-light);
    border: 2px solid var(--color-gray-medium);
    padding: 0.2rem 0.4rem;
    font-size: var(--text-size-small);
  }
  .icon {
    margin-right: 0.5em;
    opacity: 0.5;
  }
  .selected {
    background: var(--color-blue-light);
    border: 2px solid var(--color-blue-medium);
    font-weight: bold;
  }
  .selected .icon {
    opacity: 1;
  }
</style>
