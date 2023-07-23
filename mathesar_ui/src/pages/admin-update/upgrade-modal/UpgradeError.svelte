<script lang="ts">
  import {
    CancelOrProceedButtonPair,
    portalToWindowFooter,
  } from '@mathesar-component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconRefresh } from '@mathesar/icons';
  import { LL } from '@mathesar/i18n/i18n-svelte';

  export let message: string;
  export let onRetry: () => void;
  export let onClose: () => void;
</script>

<ErrorBox>{message}</ErrorBox>

<div use:portalToWindowFooter>
  <CancelOrProceedButtonPair
    onCancel={onClose}
    proceedButton={{ label: $LL.general.retry(), icon: iconRefresh }}
    onProceed={onRetry}
  />
</div>
