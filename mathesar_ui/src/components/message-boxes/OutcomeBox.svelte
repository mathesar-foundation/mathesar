<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { iconOutcome } from '@mathesar/icons';
  import MessageBox from './MessageBox.svelte';

  type $$Props = ComponentProps<MessageBox>;

  export let fullWidth = true;
</script>

<div class="outcome-box">
  <MessageBox icon={iconOutcome} {fullWidth}><slot /></MessageBox>
</div>

<style>
  .outcome-box {
    --MessageBox__background: var(--purple-100);
    --MessageBox__border: solid 1px var(--purple-300);
    --MessageBox__icon-color: var(--purple-400);
  }
</style>
