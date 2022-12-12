<script>
  import { iconOutcome } from '@mathesar/icons';
  import MessageBox from './MessageBox.svelte';
</script>

<div class="outcome-box">
  <MessageBox icon={iconOutcome}><slot /></MessageBox>
</div>

<style>
  .outcome-box {
    --background: var(--purple-100);
    --border: solid 1px var(--purple-300);
  }
</style>
