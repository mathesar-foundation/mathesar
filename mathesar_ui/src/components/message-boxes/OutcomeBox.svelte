<script>
  import { iconOutcome } from '@mathesar/icons';
  import MessageBox from './MessageBox.svelte';
</script>

<div class="outcome-box">
  <MessageBox icon={iconOutcome}><slot /></MessageBox>
</div>

<style>
  .outcome-box {
    --MessageBox__background: var(--purple-100);
    --MessageBox__border: solid 1px var(--purple-300);
    --MessageBox__icon-color: var(--purple-400);
  }
</style>
