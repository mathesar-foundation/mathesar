<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { type TransitionConfig, fade } from 'svelte/transition';
  import { _ } from 'svelte-i18n';

  import {
    Icon,
    Tooltip,
    iconClose,
    makeStyleStringFromCssVariables,
  } from '@mathesar/component-library';
  import Button from '@mathesar/component-library/button/Button.svelte';
  import focusTrap from '@mathesar/component-library/common/actions/focusTrap';
  import { iconDeleteMajor, iconDownload } from '@mathesar/icons';
  import { Dropdown, iconInfo, portal } from '@mathesar-component-library';

  import FileDetail from '../FileDetail.svelte';
  import {
    type FileManifestWithRequestParams,
    confirmRemoveFile,
  } from '../fileUtils';

  export let imageElement: HTMLImageElement;
  export let zoomOrigin: DOMRect | undefined = undefined;
  export let fileManifestWithRequestParams: FileManifestWithRequestParams;
  export let close: () => void = () => {};
  export let removeFile: () => void = () => {};

  let imageHolder: HTMLDivElement;
  let imageDisplayWidth: number;

  $: ({ attachment: downloadUrl } = fileManifestWithRequestParams);
  $: ({ naturalHeight, naturalWidth } = imageElement);
  $: showButtonLabels = imageDisplayWidth > 500;
  $: useRoundedImageCorners = naturalWidth > 100;

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        close();
        break;
      default:
        break;
    }
  }

  function zoom(
    node: HTMLElement,
    options?: { duration?: number },
  ): TransitionConfig {
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
      duration: options?.duration ?? 300,
      easing: cubicInOut,
      css: (t) =>
        buildTransform({
          translateX: translateX(t),
          translateY: translateY(t),
          scale: scale(t),
        }),
    };
  }

  async function handleClickRemove() {
    const confirmed = await confirmRemoveFile();
    if (!confirmed) return;
    removeFile();
    close();
  }

  onMount(() => {
    imageHolder.replaceChildren(imageElement);
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
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

      <div
        class="img-holder"
        bind:this={imageHolder}
        class:rounded={useRoundedImageCorners}
      />

      <div class="bottom">
        <Button
          on:click={handleClickRemove}
          aria-label={$_('remove')}
          tooltip={!showButtonLabels ? $_('remove') : undefined}
        >
          <Icon {...iconDeleteMajor} />
          <span class="button-label">{$_('remove')}</span>
        </Button>

        <Tooltip enabled={!showButtonLabels}>
          <Dropdown
            slot="trigger"
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
              <FileDetail {fileManifestWithRequestParams} />
            </div>
          </Dropdown>
          <div slot="content">{$_('info')}</div>
        </Tooltip>

        <Tooltip enabled={!showButtonLabels}>
          <a slot="trigger" class="btn btn-default" href={downloadUrl}>
            <Icon {...iconDownload} />
            <span class="button-label">{$_('download')}</span>
          </a>
          <div slot="content">{$_('download')}</div>
        </Tooltip>
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
    // - The natural image width — to prevent upscaling (in most cases)
    // - The container width to — prevent horizontal overflow
    // - A computed value to — prevent vertical overflow
    //
    // BUT: if the natural image width is super small, then we don't go smaller
    // than set limit (in order to prevent the lightbox UI from getting
    // squished).
    width: min(
      max(var(--img-natural-width-px), 10rem),
      var(--img-viewport-boundary-width),
      calc(
        var(--img-viewport-boundary-height) * var(--img-natural-width-raw) /
          var(--img-natural-height-raw)
      )
    );
    aspect-ratio: var(--img-natural-width-raw) / var(--img-natural-height-raw);
    height: auto;
    position: relative;
    display: grid;
    align-items: center;
    justify-content: center;
    border-radius: var(--sm3);
    background-color: var(--color-bg-base);
    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.4);

    .img-holder {
      width: 100%;
      height: 100%;
      max-width: var(--img-natural-width-px);
      max-height: var(--img-natural-height-px);
      overflow: hidden;
      &.rounded {
        border-radius: var(--sm3);
      }
      :global(img) {
        width: 100%;
        height: 100%;
        display: block;
        // Classic "white and gray grid" background which
        // will display behind images with transparent areas
        background: conic-gradient(#ccc 25%, white 0 50%, #ccc 0 75%, white 0);
        background-size: 20px 20px;
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
  }
</style>
