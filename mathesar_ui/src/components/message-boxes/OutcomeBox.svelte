<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { iconOutcome } from '@mathesar/icons';
  import MessageBox from './MessageBox.svelte';
  import { _ } from 'svelte-i18n';

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
    --MessageBox__background: var(--purple-100);
    --MessageBox__border: solid 4px var(--purple-300);
    --MessageBox__icon-color: var(--purple-400);
  }
</style>
