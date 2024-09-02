<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { iconInfo } from '@mathesar-component-library';

  import MessageBox from './MessageBox.svelte';

  type $$Props = ComponentProps<MessageBox>;
  export let fullWidth = true;
</script>

<div class="info-box">
  <MessageBox icon={iconInfo} {...$$restProps} fullWidth><slot /></MessageBox>
</div>

<style>
  .info-box {
    --MessageBox__background: var(--sky-200);
    --MessageBox__border: solid 4px var(--sky-300);
    --MessageBox__icon-color: var(--sky-800);
  }
</style>
