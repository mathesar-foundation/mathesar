<script lang="ts">
  // Temporary component
  // Make tab container more low-level to be used here

  import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
  import { Button, Icon } from '@mathesar-component-library';

  export let selectedTab: string;
  export let tab: string;
  export let hasError = false;
</script>

<li
  class="type-option-tab"
  class:selected={selectedTab === tab}
  class:has-error={hasError}
>
  <Button
    appearance="ghost"
    class="padding-zero"
    on:click={() => {
      selectedTab = tab;
    }}
  >
    <slot />
    {#if hasError}
      <Icon class="error-icon" data={faTimesCircle} />
    {/if}
  </Button>
</li>
