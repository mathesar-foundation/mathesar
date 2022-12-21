<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import StatusIndicator from './StatusIndicator.svelte';

  let incomingRequestState: RequestStatus['state'] | undefined;
  export { incomingRequestState as requestState };
  export let hasChanges = false;

  let requestState: RequestStatus['state'] | undefined;
  let timeout: number | undefined;
  let transitionDuration = 0;

  function clearRequestStatus() {
    transitionDuration = 1000;
    requestState = undefined;
  }

  function handleNewIncomingRequestStatus(
    s: RequestStatus['state'] | undefined,
  ) {
    window.clearTimeout(timeout);
    timeout = undefined;
    transitionDuration = 0;
    requestState = s;
    if (requestState === 'success') {
      timeout = window.setTimeout(clearRequestStatus, 5000);
    }
  }
  $: handleNewIncomingRequestStatus(incomingRequestState);

  function handleNewHasChanges(_hasChanges: boolean) {
    // If user gets server errors and then clears the form, we clear errors.
    if (!_hasChanges && requestState === 'failure') {
      requestState = undefined;
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
    if (requestState === 'processing') {
      return 'processing';
    }
    if (hasChanges && requestState === 'failure') {
      return 'failure';
    }
    if (hasChanges) {
      return 'warning';
    }
    if (requestState === 'success') {
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
