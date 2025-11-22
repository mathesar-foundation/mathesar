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
    --MessageBox__background: var(--color-bg-warning);
    --MessageBox__border: 4px solid var(--color-border-warning);
    --MessageBox__icon-color: var(--color-fg-warning);
    --MessageBox__text-color: var(--color-fg-warning);
  }
</style>
