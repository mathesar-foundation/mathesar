<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import { Icon, iconClose } from '@mathesar/component-library';
  import Button from '@mathesar/component-library/button/Button.svelte';
  import focusTrap from '@mathesar/component-library/common/actions/focusTrap';
  import { iconDeleteMajor, iconDownload } from '@mathesar/icons';
  import {
    makeDimensionsStore,
    resizeObserver,
  } from '@mathesar/utils/resizeObserver';
  import { Dropdown, iconInfo, portal } from '@mathesar-component-library';

  const imageDimensions = makeDimensionsStore();

  export let file: FileManifest;
  export let close: () => void = () => {};
  export let remove: () => void = () => {};

  $: ({ uri, direct, attachment: downloadUrl, mimetype } = file);

  /**
   * I implemented this layout using a resize observer to monitor the image
   * width. I tried HARD to get this layout to work without any JS, but I
   * eventually gave up and just slapped some JS in here for the sake of time.
   * Still, I feel it's a bit cringe. If you're reading this and you can figure
   * out how to refactor this JS out of here and just use plain CSS, then please
   * do so! It sure seems like it ought to be possible!
   */
  $: imageWidth = $imageDimensions.width;
  $: showButtonLabels = imageWidth > 500;

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        close();
        break;
      default:
        break;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  // TODO_FILES_UI
  //
  // - Implement close on click overlay (but watch out because `.content`) often
  //   obscures the overlay, especially when the viewport is short and wide.
  // - Test with a tiny image (e.g. 16px x 16px) to make sure UI is usable.
  //   Might need to adjust some min-width stuff somewhere.
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
      <Button on:click={remove} aria-label={$_('remove')}>
        <Icon {...iconDeleteMajor} />
        {#if showButtonLabels}
          <span>{$_('remove')}</span>
        {/if}
      </Button>

      <Dropdown
        showArrow={false}
        {...$$restProps}
        ariaLabel={$_('filter')}
        placements={['bottom', 'top']}
        contentClass="info-dropdown-content"
      >
        <svelte:fragment slot="trigger">
          <Icon {...iconInfo} />
          {#if showButtonLabels}
            <span>{$_('info')}</span>
          {/if}
        </svelte:fragment>
        <div class="info" slot="content">
          <table>
            <tr><th>{$_('storage_uri')}</th><td>{uri}</td></tr>
            <tr><th>{$_('mime_type')}</th><td>{mimetype}</td></tr>
          </table>
        </div>
      </Dropdown>

      <a class="btn btn-default" href={downloadUrl}>
        <Icon {...iconDownload} />
        {#if showButtonLabels}
          <span>{$_('download')}</span>
        {/if}
      </a>
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
    background-color: var(--color-modal-overlay);
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
      border-radius: var(--sm3);
      box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.4);
    }
    .bottom {
      margin-top: -1rem;
      padding-inline: 1rem;
      text-align: center;
      width: var(--image-width);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }
  }

  :global(.info-dropdown-content) {
    max-width: 90%;
  }

  .info {
    padding: var(--sm4);
    th {
      text-align: right;
      min-width: max-content;
      white-space: nowrap;
    }
    td {
      line-height: 1.2;
      padding: 0.2em;
    }
  }
</style>
