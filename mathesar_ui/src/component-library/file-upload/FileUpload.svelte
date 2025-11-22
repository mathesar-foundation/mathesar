<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import {
    iconFile,
    iconUploadFile,
  } from '@mathesar-component-library-dir/common/icons';
  import {
    formatSize,
    getGloballyUniqueId,
  } from '@mathesar-component-library-dir/common/utils';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import Progress from '@mathesar-component-library-dir/progress/Progress.svelte';

  import type { FileUpload, FileUploadAddDetail } from './FileUploadTypes';

  const dispatch = createEventDispatcher<{ add: FileUploadAddDetail }>();
  const componentId = getGloballyUniqueId();

  export let fileProgress: Record<string, number | undefined> | undefined =
    undefined;
  export let multiple = false;
  export let fileUploads: FileUpload[] | undefined = undefined;
  export let disabled = false;

  let fileId = 0;
  let isDraggingOver = false;

  function processFiles(event: Event, files: FileList | File[]) {
    const newUploads: FileUpload[] = [];
    for (const file of files) {
      newUploads.push({ fileId: `${componentId}-${fileId}`, file });
      fileId += 1;
    }
    fileUploads = [...(fileUploads || []), ...newUploads];
    dispatch('add', {
      added: newUploads,
      all: fileUploads,
      originalEvent: event,
    });
  }

  function onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      processFiles(event, target.files);
    }
    target.value = '';
  }

  function onFileDrop(event: DragEvent) {
    isDraggingOver = false;
    if (!disabled) {
      const fileList = event.dataTransfer?.files;
      if (!fileList || fileList.length === 0) {
        return;
      }
      const files = multiple ? fileList : [fileList[0]];
      processFiles(event, files);
    }
  }

  function checkAndOpen(event: KeyboardEvent) {
    if (!disabled && event.key === 'Enter') {
      (event.target as HTMLElement).click();
    }
  }
</script>

<div
  class="file-upload"
  class:disabled
  class:inprogress={fileUploads && fileUploads.length > 0}
>
  {#if fileUploads && fileUploads.length > 0}
    <div class="files">
      {#each fileUploads as upload (upload.fileId)}
        {@const percentage = Math.round(fileProgress?.[upload.fileId] ?? 0)}
        <div class="file">
          <div class="file-info">
            <div class="file-name">
              <Icon {...iconFile} />
              <span>{upload.file.name}</span>
            </div>
            <Progress {percentage} />
            <div class="upload-info">
              <span>Uploaded {percentage}%</span>
              <span>{formatSize(upload.file.size)}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <input
    type="file"
    id={componentId}
    {multiple}
    style="display: none;"
    on:change={onChange}
  />

  {#if multiple || !fileUploads || fileUploads.length === 0}
    <label
      tabindex="0"
      for={componentId}
      class="file-upload-trigger"
      class:dragging-over={isDraggingOver}
      on:keydown={checkAndOpen}
      on:drop|preventDefault|stopPropagation={onFileDrop}
      on:dragenter|preventDefault|stopPropagation={() => {
        isDraggingOver = true;
      }}
      on:dragover|preventDefault|stopPropagation={() => {
        isDraggingOver = true;
      }}
      on:dragleave|preventDefault|stopPropagation={() => {
        isDraggingOver = false;
      }}
      on:dragend|preventDefault|stopPropagation={() => {
        isDraggingOver = false;
      }}
    >
      <slot>
        <div class="message">
          <div class="icon-holder">
            <Icon {...iconUploadFile} />
          </div>
          <div class="text">
            <div class="title">Drag a file here</div>
            <div class="desc">or click to browse a file from your computer</div>
          </div>
        </div>
      </slot>
    </label>
  {/if}
</div>
