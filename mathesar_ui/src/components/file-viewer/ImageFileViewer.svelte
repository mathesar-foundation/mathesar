<script lang="ts">
  import { portal } from '@mathesar-component-library';
  import { _ } from 'svelte-i18n';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import Button from '@mathesar/component-library/button/Button.svelte';
  import focusTrap from '@mathesar/component-library/common/actions/focusTrap';
  import { Icon, iconClose } from '@mathesar/component-library';
  import {
    makeDimensionsStore,
    resizeObserver,
  } from '@mathesar/utils/resizeObserver';

  const imageDimensions = makeDimensionsStore();

  export let file: FileManifest;
  export let close: () => void = () => {};

  $: ({ uri, direct } = file);

  /**
   * I implemented this layout using a resize observer to monitor the image
   * width. I tried HARD to get this layout to work without any JS, but I
   * eventually gave up and just slapped some JS in here for the sake of time.
   * Still, I feel it's a bit cringe. If you're reading this and you can figure
   * out how to refactor this JS out of here and just use plain CSS, then please
   * do so! It sure seems like it ought to be possible!
   */
  $: imageWidth = $imageDimensions.width;

  // TODO_FILES_UI
  //
  // - close on ESC key
  // - Implement close on click overlay (but watch out because `.content`) often obscures the overlay, especially when the viewport is short and wide.
</script>

<div
  class="image-file-viewer"
  use:portal
  use:focusTrap
  style={`--image-width: ${imageWidth}px;`}
>
  <div class="overlay"></div>
  <div class="content">
    <div class="top">
      <Button on:click={close}>
        <Icon {...iconClose} />
      </Button>
    </div>
    <img alt={uri} src={direct} use:resizeObserver={imageDimensions} />
    <div class="bottom">
      {uri}
    </div>
  </div>
</div>

<style lang="scss">
  .image-file-viewer {
    position: absolute;
    overflow: hidden;
    inset: 0;
    z-index: var(--modal-z-index, auto);
    isolation: isolate;
    display: grid;
    align-items: center;
    justify-content: center;
  }
  .overlay {
    background-color: var(--modal-overlay);
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .content {
    z-index: 2;
    max-width: 100%;
    max-height: 100%;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    .top {
      display: flex;
      justify-content: flex-end;
      width: var(--image-width);
      margin-bottom: -1rem;
      margin-right: -1rem;
    }
    img {
      width: fit-content;
      max-width: 100%;
      min-height: 0;
      flex: 0 1 max-content;
    }
    .bottom {
      background: white;
      text-align: center;
      width: var(--image-width);
    }
  }
</style>
