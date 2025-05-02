<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { iconWarning } from '@mathesar-component-library';

  import MessageBox from './MessageBox.svelte';

  type $$Props = ComponentProps<MessageBox>;
</script>

<div class="warning-box">
  <MessageBox {...$$restProps} icon={iconWarning}><slot /></MessageBox>
</div>

<style>
  .warning-box {
    --MessageBox__background: var(--warning-background-color);
    --MessageBox__border: 4px solid var(--warning-border-color);
    --MessageBox__icon-color: var(--warning-color);
    --MessageBox__text-color: var(--text-color);
  }
</style>
