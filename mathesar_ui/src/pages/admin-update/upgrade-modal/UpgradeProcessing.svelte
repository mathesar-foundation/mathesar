<script lang="ts">
  import { Spinner } from '@mathesar-component-library';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { LL } from '@mathesar/i18n/i18n-svelte';
</script>

<WarningBox>
  <p>
    {$LL.upgradeProcessing.upgradeInProgress()}
  </p>
</WarningBox>
<div class="upgrading">
  <div class="spinner"><Spinner /></div>
  <div>{$LL.general.upgrading()}...</div>
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
