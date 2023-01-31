<script>
  import { iconWarning } from '@mathesar-component-library';
  import MessageBox from './MessageBox.svelte';
</script>

<div class="warning-box">
  <MessageBox {...$$restProps} icon={iconWarning}><slot /></MessageBox>
</div>

<style>
  .warning-box {
    --MessageBox__background: var(--yellow-100);
    --MessageBox__border: solid 1px var(--yellow-200);
    --MessageBox__icon-color: var(--yellow-300);
  }
</style>
