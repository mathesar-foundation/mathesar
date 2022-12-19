<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import StatusIndicator from './StatusIndicator.svelte';

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

  onDestroy(() => {
    window.clearTimeout(timeout);
  });

  $: state = (():
    | 'processing'
    | 'failure'
    | 'warning'
    | 'success'
    | undefined => {
    if (requestStatus?.state === 'processing') {
      return 'processing';
    }
    if (hasChanges && requestStatus?.state === 'failure') {
      return 'failure';
    }
    if (hasChanges) {
      return 'warning';
    }
    if (requestStatus?.state === 'success') {
      return 'success';
    }
    return undefined;
  })();

  $: transitionDuration = hasChanges ? 0 : 1000;
</script>

{#if state === 'success'}
  <span
    class="modification-status-indicator"
    out:fade|local={{ duration: transitionDuration }}
  >
    <StatusIndicator
      {state}
      messages={{
        success: 'All Changes Saved',
      }}
    />
  </span>
{:else if state}
  <span class="modification-status-indicator">
    <StatusIndicator
      {state}
      messages={{
        processing: 'Saving Changes',
        failure: 'Unable to save changes',
        warning: 'Unsaved Changes',
      }}
    />
  </span>
{/if}

<style lang="scss">
  .modification-status-indicator {
    display: inline-flex;
  }
</style>
