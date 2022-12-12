<script lang="ts" context="module">
  let id = 0;

  function getId() {
    id += 1;
    return id;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon, Progress, formatSize } from '@mathesar-component-library';
  import {
    iconFile,
    iconUploadFile,
  } from '@mathesar-component-library-dir/common/icons';
  import type { FileUpload, FileUploadAddDetail } from './FileUploadTypes';

  const dispatch = createEventDispatcher<{ add: FileUploadAddDetail }>();
  const componentId = `file-import-${getId()}`;

  export let fileProgress: Record<string, number | undefined> | undefined =
    undefined;
  export let multiple = false;
  export let fileUploads: FileUpload[] | undefined = undefined;

  let fileId = 0;
  let state = 'idle';

  function processFiles(event: Event, files: FileList | File[]) {
    const newUploads: FileUpload[] = [];

    for (const file of files) {
      newUploads.push({
        fileId: `${componentId}-${fileId}`,
        file,
      });
      fileId += 1;
    }
    fileUploads = [...(fileUploads || []), ...newUploads];

    const fileUploadAddEvent: FileUploadAddDetail = {
      added: newUploads,
      all: fileUploads,
      originalEvent: event,
    };

    dispatch('add', fileUploadAddEvent);
  }

  function onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      processFiles(event, target.files);
    }
    target.value = '';
  }

  function onFileDrop(event: DragEvent) {
    const fileList = event.dataTransfer?.files;
    if (!fileList) {
      return;
    }
    if (multiple) {
      processFiles(event, fileList);
    } else {
      processFiles(event, [fileList[0]]);
    }
  }

  function checkAndOpen(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      (event.target as HTMLElement).click();
    }
  }
</script>

<div
  class="file-upload"
  class:inprogress={fileUploads && fileUploads.length > 0}
>
  {#if fileUploads && fileUploads.length > 0}
    <div class="files">
      {#each fileUploads as upload (upload.fileId)}
        <div class="file">
          <div class="file-info">
            <div class="file-name">
              <Icon {...iconFile} />
              <span>{upload.file.name}</span>
            </div>
            <Progress
              percentage={Math.round(fileProgress?.[upload.fileId] ?? 0)}
            />
            <div class="upload-info">
              <span>
                Uploaded {Math.round(fileProgress?.[upload.fileId] ?? 0)}%
              </span>
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
      class="file-upload-trigger {state}"
      on:keydown={checkAndOpen}
      on:drop|preventDefault|stopPropagation={onFileDrop}
      on:dragenter|preventDefault|stopPropagation={() => {
        state = 'in';
      }}
      on:dragover|preventDefault|stopPropagation={() => {
        state = 'in';
      }}
      on:dragleave|preventDefault|stopPropagation={() => {
        state = 'out';
      }}
      on:dragend|preventDefault|stopPropagation={() => {
        state = 'out';
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
