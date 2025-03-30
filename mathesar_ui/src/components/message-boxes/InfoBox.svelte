<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { iconInfo } from '@mathesar-component-library';

  import MessageBox from './MessageBox.svelte';

  type $$Props = ComponentProps<MessageBox>;
</script>

<div class="info-box">
  <MessageBox icon={iconInfo} {...$$restProps} fullWidth><slot /></MessageBox>
</div>

<style>
  .info-box {
    --MessageBox__background: var(--info-background-color);
    --MessageBox__border: 4px solid var(--info-border-color);
    --MessageBox__icon-color: var(--info-color);
    --MessageBox__text-color: var(--text-color);
  }
</style>
