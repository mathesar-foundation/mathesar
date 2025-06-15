<script lang="ts">
  import { iconDatabase, iconExpandRight } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import { Icon } from '@mathesar-component-library';

  export let database: Database;
  export let upgradeRequired = false;

  $: showDbName = database.name !== database.displayName;
  $: server = database.server.getConnectionString();
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
      <span>{server}</span>
    </div>
  </div>
  {#if !upgradeRequired}
    <div class="caret-container">
      <Icon {...iconExpandRight} size="1rem" />
    </div>
  {/if}
</div>

<style lang="scss">
  .db-card-content {
    padding: var(--lg1);
    font-size: var(--lg1);
    display: flex;
    align-items: center;
    gap: var(--lg2);
    position: relative;
  }

  .icon-container {
    background: linear-gradient(135deg, var(--SYS-accent-amethyst-base), var(--SYS-accent-amethyst-darker));
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--SYS-text-inverted);
  }

  .content {
    display: flex;
    flex-direction: column;
  }

  .display-name {
    font-size: var(--lg2);
    font-weight: var(--font-weight-medium);
    color: var(--SYS-text-primary);
  }

  .db-name {
    font-size: var(--lg1);
    font-weight: var(--font-weight-normal);
    color: var(--SYS-text-secondary);
  }

  .detail {
    font-size: 1rem;
    color: var(--SYS-text-disabled);
  }

  .caret-container {
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .db-card-content:hover .caret-container {
    opacity: 1;
  }
</style>
