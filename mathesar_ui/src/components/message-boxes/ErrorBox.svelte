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
    --MessageBox__background: var(--danger-background-color);
    --MessageBox__border: solid 1px var(--danger-color);
    --MessageBox__icon-color: var(--danger-color);
    font-size: var(--ErrorBox__font-size, var(--text-size-small));
  }
</style>
