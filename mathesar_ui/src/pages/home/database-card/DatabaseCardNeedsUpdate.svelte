<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { Button, Icon } from '@mathesar/component-library';
  import { iconRequiresUpgrade } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';

  import DatabaseCardContent from './DatabaseCardContent.svelte';

  export let database: Database;
  export let onTriggerUpgrade: (database: Database) => void;
</script>

<div class="db-card-needs-update">
  <div class="content">
    <DatabaseCardContent {database} upgradeRequired />
  </div>
  <div class="action">
    <div class="indicator">
      <Icon {...iconRequiresUpgrade} />
      {$_('upgrade_required')}
    </div>
    <Button on:click={() => onTriggerUpgrade(database)}>
      {$_('upgrade')}
    </Button>
  </div>
</div>

<style>
  .db-card-needs-update {
    background: var(--gray-100);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  .content {
    flex: 1 0 auto;
  }
  .action {
    flex: 1 0 min-content;
    flex-wrap: wrap;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: flex-end;
    padding: 0.8rem;
  }
  .indicator {
    color: var(--yellow-800);
    padding: 0.2rem 0.5rem;
    border-radius: 500px;
    min-width: max-content;
  }
</style>
