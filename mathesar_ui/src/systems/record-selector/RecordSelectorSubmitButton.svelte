<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { iconLinkToRecordPage, iconPickRecord } from '@mathesar/icons';
  import { Icon } from '@mathesar-component-library';

  import type { RecordSelectorPurpose } from './recordSelectorUtils';

  const dispatch = createEventDispatcher();

  export let purpose: RecordSelectorPurpose;
  export let isSelected: boolean;

  $: icon = purpose === 'dataEntry' ? iconPickRecord : iconLinkToRecordPage;
  $: phrase = purpose === 'dataEntry' ? $_('pick') : $_('open');
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
    font-size: var(--sm1);
    font-weight: bold;
    white-space: nowrap;
  }
</style>
