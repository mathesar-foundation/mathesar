<script lang="ts">
  import { _ } from 'svelte-i18n';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';

  export let deprecatedDatabaseNames: string[] = [];

  $: hasDeprecated = deprecatedDatabaseNames.length > 0;
  $: databaseList = deprecatedDatabaseNames.join(', ');
</script>

{#if hasDeprecated}
  <WarningBox>
    <div class="warning-content">
      <p>
        {$_('postgres_deprecation_warning', {
          values: { names: databaseList },
        })}
      </p>
      <p class="help-text">
        {$_('postgres_deprecation_help')}
      </p>
    </div>
  </WarningBox>
{/if}

<style lang="scss">
  .warning-content {
    p {
      margin: 0.25rem 0;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .help-text {
      font-size: 0.9rem;
      opacity: 0.9;
    }
  }
</style>
