<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { iconDeleteMajor, iconDownload } from '@mathesar/icons';
  import {
    AttachableDropdown,
    Button,
    Icon,
    focusTrap,
  } from '@mathesar-component-library';

  import FileDetail from '../FileDetail.svelte';
  import {
    type FileManifestWithRequestParams,
    confirmRemoveFile,
  } from '../fileUtils';

  export let trigger: HTMLElement;
  export let fileManifestWithRequestParams: FileManifestWithRequestParams;
  export let close: () => void = () => {};
  export let removeFile: () => void = () => {};

  $: ({ attachment: downloadUrl } = fileManifestWithRequestParams);

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        close();
        break;
      default:
        break;
    }
  }

  async function handleClickRemove() {
    const confirmed = await confirmRemoveFile();
    if (!confirmed) return;
    removeFile();
    close();
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<AttachableDropdown
  isOpen
  {trigger}
  on:close={close}
  placements={['bottom', 'top']}
>
  <div class="file-actions" use:focusTrap>
    <FileDetail {fileManifestWithRequestParams} />
    <div class="actions">
      <Button on:click={handleClickRemove} aria-label={$_('remove')}>
        <Icon {...iconDeleteMajor} />
        <span class="button-label">{$_('remove')}</span>
      </Button>
      <a class="btn btn-default" href={downloadUrl}>
        <Icon {...iconDownload} />
        <span class="button-label">{$_('download')}</span>
      </a>
    </div>
  </div>
</AttachableDropdown>

<style>
  .file-actions {
    width: 24rem;
    max-width: 100%;
    padding: var(--sm1);
  }

  .actions {
    display: flex;
    justify-content: space-between;
    margin-top: var(--lg1);
  }
</style>
