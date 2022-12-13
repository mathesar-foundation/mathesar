<script>
  import { iconInfo } from '@mathesar-component-library';
  import MessageBox from './MessageBox.svelte';
</script>

<div class="info-box">
  <MessageBox icon={iconInfo}><slot /></MessageBox>
</div>

<style>
  .info-box {
    --MessageBox__background: var(--sky-200);
    --MessageBox__border: solid 1px var(--sky-300);
  }
</style>
