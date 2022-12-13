<script>
  import { iconWarning } from '@mathesar-component-library';
  import MessageBox from './MessageBox.svelte';
</script>

<div class="warning-box">
  <MessageBox icon={iconWarning}><slot /></MessageBox>
</div>

<style>
  .warning-box {
    --MessageBox__background: var(--yellow-100);
  }
</style>
