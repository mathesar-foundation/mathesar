<script>
  import { iconError } from '@mathesar-component-library';
  import MessageBox from './MessageBox.svelte';
</script>

<div class="error-box">
  <MessageBox icon={iconError}><slot /></MessageBox>
</div>

<style>
  .error-box {
    --background: var(--danger-background-color);
    --icon-color: var(--danger-color);
    font-size: var(--text-size-small);
  }
</style>
