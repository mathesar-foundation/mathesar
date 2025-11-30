<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconWarning } from '@mathesar-component-library';

  import MessageBox from './MessageBox.svelte';

  export let databaseName: string;
  export let postgresVersion: string;
  export let warningMessage: string;
</script>

<div class="deprecation-warning-box">
  <MessageBox icon={iconWarning}>
    <div class="warning-content">
      <p class="warning-title">{$_('deprecation_warning_title')}</p>
      <p class="warning-text">
        {$_('deprecation_warning_message', {
          values: { databaseName, postgresVersion },
        })}
        {warningMessage.toLowerCase()}.
      </p>
      <p class="warning-action">
        {$_('deprecation_warning_action')}
      </p>
    </div>
  </MessageBox>
</div>

<style>
  .deprecation-warning-box {
    --MessageBox__background: var(--color-bg-warning);
    --MessageBox__border: 4px solid var(--color-border-warning);
    --MessageBox__icon-color: var(--color-fg-warning);
    --MessageBox__text-color: var(--color-fg-warning);
  }

  .warning-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .warning-title {
    font-weight: 600;
    margin: 0;
  }

  .warning-text {
    margin: 0;
  }

  .warning-action {
    margin: 0;
    font-style: italic;
  }
</style>
