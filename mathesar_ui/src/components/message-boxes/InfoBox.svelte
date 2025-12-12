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
    --MessageBox__background: var(--color-bg-info);
    --MessageBox__border: 4px solid var(--color-border-info);
    --MessageBox__icon-color: var(--color-fg-info);
    --MessageBox__text-color: var(--color-fg-info);
  }
</style>
