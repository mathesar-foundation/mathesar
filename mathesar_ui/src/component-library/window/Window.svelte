<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import { iconClose } from '@mathesar-component-library-dir/common/icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';

  const dispatch = createEventDispatcher();

  /**
   * Hurl the close button way past any focusable elements that might appear
   * within the window.
   *
   * When a window is opened via a modal, we auto-focus the first focusable
   * element within the modal. We'd like that to be the first input within the
   * window's body, not the window close button. This customized tabIndex
   * rearranges the tab index flow such that the close button is last. Hopefully
   * this is more intuitive to users than it being first.
   */
  const closeButtonTabIndex = 9999;

  export let title: string | undefined = undefined;
  export let hasCloseButton = true;
  export let canScrollBody = true;
  export let hasBodyPadding = true;

  function handleCloseButtonClick() {
    dispatch('close');
  }
</script>

<div
  class="window"
  class:can-scroll-body={canScrollBody}
  class:has-body-padding={hasBodyPadding}
  data-window-area="window"
>
  {#if $$slots.title || title || hasCloseButton}
    <div class="title-bar" data-window-area="title-bar">
      <div class="title" data-window-area="title">
        <slot name="title" />
        {title ?? ''}
      </div>
      {#if hasCloseButton}
        <Button
          appearance="plain"
          on:click={handleCloseButtonClick}
          tabIndex={closeButtonTabIndex}
        >
          <Icon {...iconClose} />
        </Button>
      {/if}
    </div>
  {/if}
  <div class="body" data-window-area="body">
    <slot />
  </div>
  <div class="footer" data-window-area="footer">
    <slot name="footer" />
  </div>
</div>
