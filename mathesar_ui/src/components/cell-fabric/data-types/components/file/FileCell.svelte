<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import Default from '@mathesar/components/Default.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { Icon, iconExpandDown } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';

  const dispatch = createEventDispatcher();

  export let fileManifest: FileManifest | undefined = undefined;
  export let isActive: boolean;
  export let value: unknown = undefined;
  export let disabled: boolean;
  export let isIndependentOfSheet: boolean;

  let wasActiveBeforeClick = false;
  let cellWrapperElement: HTMLElement;

  $: hasValue = value !== undefined && value !== null;

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isActive) {
          // TODO_FILES_UI: open file viewer
        }
        break;
      case 'Tab':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowDown':
      case 'ArrowUp':
        dispatch('movementKeyDown', {
          originalEvent: e,
          key: e.key,
        });
        break;
      default:
        break;
    }
  }

  function handleMouseDown() {
    wasActiveBeforeClick = isActive;
    dispatch('activate');
  }

  function upload() {
    // TODO_FILES_UI
  }
</script>

<CellWrapper
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
  hasPadding={false}
  bind:element={cellWrapperElement}
>
  <div class="file-cell" class:disabled>
    <div class="value">
      {#if hasValue}
        <!-- TODO_FILES_UI -->
        {fileManifest?.mimetype}
      {:else if value === undefined}
        <Default />
      {:else}
        <Null />
      {/if}
    </div>
    {#if !disabled}
      <button
        class="dropdown-button passthrough"
        on:click={upload}
        aria-label={$_('TODO_FILES_UI')}
        title={$_('TODO_FILES_UI')}
      >
        <Icon {...iconExpandDown} />
      </button>
    {/if}
  </div>
</CellWrapper>

<style>
  .file-cell {
    flex: 1 0 auto;
    display: flex;
    justify-content: space-between;
  }
  .value {
    padding: var(--cell-padding);
    align-self: center;
    overflow: hidden;
    width: max-content;
    max-width: 100%;
    color: var(--text-color);
  }
  .disabled .value {
    padding-right: var(--cell-padding);
  }
  .dropdown-button {
    cursor: pointer;
    padding: 0 var(--cell-padding);
    display: flex;
    align-items: center;
    color: var(--text-color-muted);
  }
  .dropdown-button:hover {
    color: var(--text-color);
  }
</style>
