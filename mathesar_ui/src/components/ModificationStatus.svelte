<script lang="ts">
  import { fade } from 'svelte/transition';

  import {
    Icon,
    iconError,
    iconSuccess,
    Spinner,
  } from '@mathesar-component-library';
  import { iconUnsavedChanges } from '@mathesar/icons';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';

  let incomingRequestStatus: RequestStatus | undefined;
  export { incomingRequestStatus as requestStatus };
  export let hasChanges = false;

  let requestStatus: RequestStatus | undefined;
  let timeout: number | undefined;

  function clearRequestStatus() {
    requestStatus = undefined;
  }

  function handleNewIncomingRequestStatus(s: RequestStatus | undefined) {
    window.clearTimeout(timeout);
    timeout = undefined;
    requestStatus = s;
    if (requestStatus?.state === 'success') {
      timeout = window.setTimeout(clearRequestStatus, 5000);
    }
  }
  $: handleNewIncomingRequestStatus(incomingRequestStatus);

  function handleNewHasChanges(_hasChanges: boolean) {
    // If user gets server errors and then clears the form, we clear errors.
    if (!_hasChanges && requestStatus?.state === 'failure') {
      requestStatus = undefined;
    }
  }
  $: handleNewHasChanges(hasChanges);

  $: transitionDuration = hasChanges ? 0 : 1000;
</script>

{#if requestStatus?.state === 'processing'}
  <span class="modification-status-indicator processing">
    <span class="icon"><Spinner /></span>
    <span>Saving Changes</span>
  </span>
{:else if hasChanges && requestStatus?.state === 'failure'}
  <span class="modification-status-indicator failure">
    <span class="icon"><Icon {...iconError} /></span>
    <span>Unable to save changes</span>
  </span>
{:else if hasChanges}
  <span class="modification-status-indicator unsaved">
    <span class="icon"><Icon {...iconUnsavedChanges} /></span>
    <span>Unsaved Changes</span>
  </span>
{:else if requestStatus?.state === 'success'}
  <span
    class="modification-status-indicator success"
    out:fade={{ duration: transitionDuration }}
  >
    <span class="icon"><Icon {...iconSuccess} /></span>
    <span>All Changes Saved</span>
  </span>
{/if}

<style>
  .modification-status-indicator {
    border-radius: 500px;
    padding: 0.5em 0.75rem;
    font-size: var(--text-size-small);
    display: inline-flex;
    align-items: center;
    color: var(--slate-400);
    white-space: nowrap;
  }
  .icon > :global(*) {
    display: block;
  }
  .modification-status-indicator > :global(* + *) {
    margin-left: 0.5em;
  }
  .processing {
    background: var(--sky-200);
  }
  .unsaved {
    background: var(--yellow-100);
  }
  .success {
    background: var(--green-100);
  }
  .failure {
    background-color: var(--danger-background-color);
  }
  .failure .icon {
    color: var(--danger-color);
  }
</style>
