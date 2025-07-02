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
    --MessageBox__background: var(--semantic-danger-bg);
    --MessageBox__border: 4px solid var(--semantic-danger-border);
    --MessageBox__icon-color: var(--semantic-danger-icon);
    --MessageBox__text-color: var(--semantic-danger-text);
    font-size: var(--ErrorBox__font-size, var(--sm1));
  }
</style>
