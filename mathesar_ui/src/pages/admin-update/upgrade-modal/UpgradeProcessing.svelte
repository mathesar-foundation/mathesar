<script lang="ts">
  import { Spinner } from '@mathesar-component-library';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
</script>

<WarningBox>
  <p>
    A Mathesar upgrade is currently in progress. It is important that you do not
    navigate away from this page until the upgrade is complete.
  </p>
</WarningBox>
<div class="upgrading">
  <div class="spinner"><Spinner /></div>
  <div>Upgrading...</div>
</div>

<style>
  .upgrading {
    text-align: center;
    margin-top: 1rem;
    font-size: var(--text-size-large);
  }
  .spinner {
    margin: 1rem;
    font-size: 3rem;
    color: var(--slate-300);
  }
</style>
