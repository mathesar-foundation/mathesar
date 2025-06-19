<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { iconError } from '@mathesar-component-library';

  import MessageBox from './MessageBox.svelte';

  type $$Props = ComponentProps<MessageBox>;
</script>

<div class="warning-box">
  <MessageBox {...$$restProps} icon={iconError}><slot /></MessageBox>
</div>

<style>
  .warning-box {
    --MessageBox__background: var(--SYS-semantic-warning-bg);
    --MessageBox__border: 4px solid var(--SYS-semantic-warning-border);
    --MessageBox__icon-color: var(--SYS-semantic-warning-icon);
    --MessageBox__text-color: var(--SYS-semantic-warning-text);
  }
</style>
