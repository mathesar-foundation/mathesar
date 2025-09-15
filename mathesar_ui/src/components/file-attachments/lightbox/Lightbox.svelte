<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { type TransitionConfig, fade } from 'svelte/transition';
  import { _ } from 'svelte-i18n';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import {
    Icon,
    iconClose,
    makeStyleStringFromCssVariables,
  } from '@mathesar/component-library';
  import Button from '@mathesar/component-library/button/Button.svelte';
  import focusTrap from '@mathesar/component-library/common/actions/focusTrap';
  import { iconDeleteMajor, iconDownload } from '@mathesar/icons';
  import { Dropdown, iconInfo, portal } from '@mathesar-component-library';

  export let imageElement: HTMLImageElement;
  export let zoomOrigin: DOMRect | undefined = undefined;
  export let fileManifest: FileManifest;
  export let close: () => void = () => {};
  export let removeFile: () => void = () => {};

  let imageHolder: HTMLDivElement;
  let imageDisplayWidth: number;

  $: ({ uri, attachment: downloadUrl, mimetype } = fileManifest);
  $: ({ naturalHeight, naturalWidth } = imageElement);
  $: showButtonLabels = imageDisplayWidth > 500;

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        close();
        break;
      default:
        break;
    }
  }

  function zoom(node: HTMLElement): TransitionConfig {
    if (!zoomOrigin) return {};
    const nodeRect = node.getBoundingClientRect();

    function getRectCenter(rect: DOMRect) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    const nodeCenter = getRectCenter(nodeRect);
    const originCenter = getRectCenter(zoomOrigin);

    function interpolate(start: number, end: number, unit?: string) {
      return (t: number) => `${start + (end - start) * t}${unit ?? ''}`;
    }

    function buildTransform(props: Record<string, string>) {
      const value = Object.entries(props)
        .map(([fn, arg]) => `${fn}(${arg})`)
        .join(' ');
      return `transform: ${value};`;
    }

    const scale = interpolate(zoomOrigin.width / nodeRect.width, 1);
    const translateX = interpolate(originCenter.x - nodeCenter.x, 0, 'px');
    const translateY = interpolate(originCenter.y - nodeCenter.y, 0, 'px');

    return {
      duration: 300,
      easing: cubicInOut,
      css: (t) =>
        buildTransform({
          translateX: translateX(t),
          translateY: translateY(t),
          scale: scale(t),
        }),
    };
  }

  onMount(() => {
    imageHolder.replaceChildren(imageElement);
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
  class="lightbox"
  use:portal
  use:focusTrap
  style={makeStyleStringFromCssVariables({
    '--img-natural-height-raw': `${naturalHeight}`,
    '--img-natural-width-raw': `${naturalWidth}`,
    '--img-natural-height-px': `${naturalHeight}px`,
    '--img-natural-width-px': `${naturalWidth}px`,
  })}
>
  <div class="overlay" transition:fade|local={{ duration: 200 }}></div>
  <div class="img-viewport-boundary">
    <div
      class="img-area"
      class:show-button-labels={showButtonLabels}
      bind:clientWidth={imageDisplayWidth}
      transition:zoom|local
    >
      <div class="top">
        <Button on:click={close}>
          <Icon {...iconClose} />
        </Button>
      </div>

      <div class="img-holder" bind:this={imageHolder} />

      <div class="bottom">
        <Button on:click={removeFile} aria-label={$_('remove')}>
          <Icon {...iconDeleteMajor} />
          <span class="button-label">{$_('remove')}</span>
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
            <span class="button-label">{$_('info')}</span>
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
          <span class="button-label">{$_('download')}</span>
        </a>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .lightbox {
    position: absolute;
    inset: 0;
    z-index: var(--modal-z-index, auto);
    isolation: isolate;
    display: grid;
    align-items: center;
    justify-content: center;
    --viewport-padding-block: 1.5rem;
    --viewport-padding-inline: 1rem;
    --img-viewport-boundary-height: calc(
      100dvh - 2 * var(--viewport-padding-block)
    );
    --img-viewport-boundary-width: calc(
      100dvw - 2 * var(--viewport-padding-inline)
    );
  }
  .overlay {
    background-color: var(--color-modal-overlay);
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .img-viewport-boundary {
    z-index: 2;
    height: var(--img-viewport-boundary-height);
    width: var(--img-viewport-boundary-width);
    display: grid;
    align-items: center;
    align-content: center;
    justify-items: center;
    justify-content: center;
  }

  .img-area {
    // Width is the smallest of:
    //
    // - The natural image width — to prevent upscaling
    // - The container width to — prevent horizontal overflow
    // - A computed value to — prevent vertical overflow
    width: min(
      var(--img-natural-width-px),
      var(--img-viewport-boundary-width),
      calc(
        var(--img-viewport-boundary-height) * var(--img-natural-width-raw) /
          var(--img-natural-height-raw)
      )
    );
    aspect-ratio: var(--img-natural-width-raw) / var(--img-natural-height-raw);
    height: auto;
    position: relative;

    .img-holder {
      width: 100%;
      height: 100%;
      border-radius: var(--sm3);
      box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.4);
      overflow: hidden;
      :global(img) {
        width: 100%;
        height: 100%;
        display: block;
      }
    }

    .top {
      position: absolute;
      top: -1rem;
      right: -0.5rem;
    }
    .bottom {
      position: absolute;
      bottom: -1rem;
      left: 0;
      padding-inline: 1rem;
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    &:not(.show-button-labels) .button-label {
      display: none;
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
