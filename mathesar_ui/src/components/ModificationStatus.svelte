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
  let transitionDuration = 0;

  function clearRequestStatus() {
    transitionDuration = 1000;
    requestStatus = undefined;
  }

  function handleNewIncomingRequestStatus(s: RequestStatus | undefined) {
    window.clearTimeout(timeout);
    timeout = undefined;
    transitionDuration = 0;
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
</script>

{#if state}
  <span
    class="modification-status-indicator"
    out:fade|local={{ duration: transitionDuration }}
  >
    <StatusIndicator
      {state}
      messages={{
        processing: 'Saving Changes',
        failure: 'Unable to save changes',
        warning: 'Unsaved Changes',
        success: 'All Changes Saved',
      }}
    />
  </span>
{/if}

<style lang="scss">
  .modification-status-indicator {
    display: inline-flex;
  }
</style>
