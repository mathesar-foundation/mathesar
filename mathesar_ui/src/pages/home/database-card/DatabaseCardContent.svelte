<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { staticText } from '@mathesar/i18n/staticText';
  import { iconDatabase, iconExpandRight } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import { Icon } from '@mathesar-component-library';

  export let database: Database;
  export let upgradeRequired = false;

  $: server = `${database.server.host}:${database.server.port}`;
  $: showDbName = database.name !== database.displayName;
</script>

<div class="db-card-content" class:upgrade-required={upgradeRequired}>
  <div class="icon-container">
    <Icon {...iconDatabase} size="1.25rem" class="database-icon" />
  </div>
  <div class="content">
    <div class="display-name">
      {database.displayName}
      {#if showDbName}
        <span class="db-name">({database.name})</span>
      {/if}
    </div>
    <div class="detail">
      <!-- <span class="label">{$_('db_server')}:</span> -->
      <span>{server}</span>
    </div>
  </div>
  <div class="caret-container">
    <Icon {...iconExpandRight} size="1rem" class="caret-icon" />
  </div>
</div>

<style lang="scss">
  .db-card-content {
    padding: 1.5rem;
    font-size: var(--text-size-large);
    display: flex;
    align-items: center;
    gap: 1.5rem;
    position: relative;
  }

  .icon-container {
    background-color: var(--icon-background);
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .upgrade-required .database-icon {
    color: var(--stormy-400);
  }

  .content {
    display: flex;
    flex-direction: column;
  }

  .display-name {
    font-size: var(--text-size-xx-large);
    font-weight: var(--font-weight-medium);
    color: var(--text-color-primary);
  }

  .db-name {
    font-size: var(--text-size-large);
    font-weight: var(--font-weight-normal);
    color: var(--text-color-secondary);
  }

  .detail {
    font-size: var(--text-size-base);
    color: var(--text-color-secondary);
  }

  .label {
    color: var(--text-color-secondary);
  }

  .caret-container {
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .caret-icon {
    color: var(--stormy-400);
    font-size: 1.25rem;
  }

  .db-card-content:hover .caret-container {
    opacity: 1;
  }
</style>
