<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { iconOutcome } from '@mathesar/icons';

  import MessageBox from './MessageBox.svelte';

  type $$Props = ComponentProps<MessageBox>;

  export let fullWidth = true;
  export let title = $_('whats_changing');
</script>

<div class="outcome-box">
  <MessageBox icon={iconOutcome} {fullWidth} {title}>
    <slot />
  </MessageBox>
</div>

<style>
  .outcome-box {
    --MessageBox__background: var(--outcome-background-color);
    --MessageBox__border: 4px solid var(--outcome-border-color);
    --MessageBox__icon-color: var(--outcome-color);
    --MessageBox__text-color: var(--outcome-color);
  }
</style>
