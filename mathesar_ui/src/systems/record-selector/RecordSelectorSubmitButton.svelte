<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { Icon } from '@mathesar-component-library';
  import { iconLinkToRecordPage, iconPickRecord } from '@mathesar/icons';
  import type { RecordSelectorPurpose } from './recordSelectorUtils';
  import { LL } from '@mathesar/i18n/i18n-svelte';

  const dispatch = createEventDispatcher();

  export let purpose: RecordSelectorPurpose;
  export let isSelected: boolean;

  $: icon = purpose === 'dataEntry' ? iconPickRecord : iconLinkToRecordPage;
  $: phrase = purpose === 'dataEntry' ? $LL.general.pick() : $LL.general.open();
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
  class:hover={isSelected}
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
    font-size: var(--text-size-small);
    font-weight: bold;
    white-space: nowrap;
  }
</style>
