<script lang="ts">
  import { Icon } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let icon: IconProps | undefined = undefined;
  export let style: string | undefined = undefined;
  export let fullWidth = false;
  export let title: string | undefined = undefined;
</script>

<div
  class="message-box"
  class:has-icon={!!icon}
  {style}
  class:full-width={fullWidth}
>
  {#if icon}
    <span class="icon">
      <Icon {...icon} />
    </span>
  {/if}
  <div class="content trim-child-margins">
    {#if title}
      <h3 class="title">{title}</h3>
    {/if}
    <slot />
  </div>
</div>

<style>
  .message-box {
    padding: 0.7em;
    position: relative;
    border-radius: var(--border-radius-m);
    margin: var(--MessageBox__margin);
    background: var(--MessageBox__background);
    border-left: var(--MessageBox__border);
  }
  .message-box:not(.full-width) {
    max-width: max-content;
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
  .title {
    font-size: var(--size-large);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--size-ultra-small);
  }
</style>
