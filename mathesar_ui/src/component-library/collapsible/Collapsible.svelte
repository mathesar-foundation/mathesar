<script lang="ts">
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import { iconExpandDown } from '@mathesar-component-library-dir/common/icons';

  export let isOpen = false;
  export let noStyle = false;
</script>

<div class="collapsible">
  <Button
    class={`collapsible-header ${noStyle && 'no-style'}`}
    on:click={() => {
      isOpen = !isOpen;
    }}
  >
    <div class="collapsible-header-title">
      <slot name="header" />
    </div>
    <Icon {...iconExpandDown} size="0.7rem" rotate={isOpen ? 180 : undefined} />
  </Button>
  {#if isOpen}
    <div class="collapsible-content">
      <slot name="content" />
    </div>
  {/if}
</div>
