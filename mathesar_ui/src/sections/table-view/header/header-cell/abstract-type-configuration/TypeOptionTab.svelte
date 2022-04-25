<script lang="ts">
  // Temporary component
  // Make tab container more low-level to be used here
  import { createEventDispatcher } from 'svelte';
  import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
  import { Button, Icon } from '@mathesar-component-library';

  const dispatch = createEventDispatcher();

  export let selectedTab: string;
  export let tab: string;
  export let hasError = false;

  function handleTabChange() {
    if (selectedTab !== tab) {
      selectedTab = tab;
      dispatch('select', tab);
    }
  }
</script>

<li
  class="type-option-tab"
  class:selected={selectedTab === tab}
  class:has-error={hasError}
>
  <Button appearance="ghost" class="padding-zero" on:click={handleTabChange}>
    <slot />
    {#if hasError}
      <Icon class="error-icon" size="0.75em" data={faTimesCircle} />
    {/if}
  </Button>
</li>
