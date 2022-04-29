<script lang="ts" context="module">
  let id = 0;

  function getId() {
    id += 1;
    return id;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { faFile, faFileUpload } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Progress, formatSize } from '@mathesar-component-library';
  import type {
    FileUpload,
    FileUploadProgress,
    FileUploadAddDetail,
  } from './FileUploadTypes';

  const dispatch = createEventDispatcher();
  const componentId = `file-import-${getId()}`;

  export let fileProgress: Record<string, FileUploadProgress> | undefined =
    undefined;
  export let multiple = false;
  export let fileUploads: FileUpload[] | undefined = undefined;

  let fileId = 0;
  let state = 'idle';

  export function updateState(
    fileIdentifier: string,
    progress: FileUploadProgress,
  ): void {
    fileProgress = {
      ...fileProgress,
      [fileIdentifier]: progress,
    };
  }

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
          <Icon data={faFile} size="3.5em" />
          <div class="file-info">
            <div class="name">{upload.file.name}</div>
            <Progress
              percentage={Math.round(
                fileProgress?.[upload.fileId]?.progress || 0,
              )}
            />
            <div class="upload-info">
              <span>
                Uploaded {Math.round(
                  fileProgress?.[upload.fileId]?.progress || 0,
                )}%
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
          <Icon size="60px" data={faFileUpload} />
          <div class="text">
            <div class="title">Drag a file here</div>
            <div>or click to browse a file from your computer</div>
          </div>
        </div>
      </slot>
    </label>
  {/if}
</div>
