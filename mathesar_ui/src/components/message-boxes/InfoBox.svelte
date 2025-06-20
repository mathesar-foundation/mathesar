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
    --MessageBox__background: var(--semantic-info-bg);
    --MessageBox__border: 4px solid var(--semantic-info-border);
    --MessageBox__icon-color: var(--semantic-info-icon);
    --MessageBox__text-color: var(--semantic-info-text);
  }
</style>
