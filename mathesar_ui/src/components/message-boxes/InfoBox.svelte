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
    --MessageBox__background: var(--SYS-semantic-info-bg);
    --MessageBox__border: 4px solid var(--SYS-semantic-info-border);
    --MessageBox__icon-color: var(--SYS-semantic-info-icon);
    --MessageBox__text-color: var(--SYS-semantic-info-text);
  }
</style>
