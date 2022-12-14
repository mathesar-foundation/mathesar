<script lang="ts">
  import type { IconProps } from '@mathesar-component-library/types';
  import { Icon } from '@mathesar-component-library';

  export let icon: IconProps | undefined = undefined;
  export let style: string | undefined = undefined;
</script>

<div class="message-box" class:has-icon={!!icon} {style}>
  {#if icon}
    <span class="icon">
      <Icon {...icon} />
    </span>
  {/if}
  <div class="content trim-child-margins">
    <slot />
  </div>
</div>

<style>
  .message-box {
    padding: 0.7em;
    position: relative;
    border-radius: var(--border-radius-m);
    max-width: max-content;
    margin: var(--MessageBox__margin);
    background: var(--MessageBox__background);
    border: var(--MessageBox__border);
  }
  .message-box.has-icon {
    padding-left: 2.25em;
  }
  .icon {
    position: absolute;
    left: 0.8em;
    top: 0.7em;
    color: var(--MessageBox__icon-color, currentcolor);
  }
</style>
