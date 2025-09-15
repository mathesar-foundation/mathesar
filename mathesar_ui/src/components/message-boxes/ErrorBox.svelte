<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { iconError } from '@mathesar-component-library';

  import MessageBox from './MessageBox.svelte';

  type $$Props = ComponentProps<MessageBox>;
</script>

<div class="error-box">
  <MessageBox icon={iconError} {...$$restProps}><slot /></MessageBox>
</div>

<style>
  .error-box {
    --MessageBox__background: var(--color-bg-danger);
    --MessageBox__border: 4px solid var(--color-border-danger);
    --MessageBox__icon-color: var(--color-fg-danger);
    --MessageBox__text-color: var(--color-fg-danger);
    font-size: var(--ErrorBox__font-size, var(--sm1));
  }
</style>
