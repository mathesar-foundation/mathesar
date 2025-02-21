<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { staticText } from '@mathesar/i18n/staticText';
  import { iconDatabase } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import { Icon } from '@mathesar-component-library';

  export let database: Database;
  export let upgradeRequired = false;

  $: server = `${database.server.host}:${database.server.port}`;
</script>

<div class="db-card-content" class:upgrade-required={upgradeRequired}>
  <div class="circle"><Icon {...iconDatabase} size="1.1rem" /></div>
  <div class="display-name">{database.displayName}</div>
  <div class="detail">
    <span class="label">{$_('db_server')}{staticText.COLON}</span>
    <span>{server}</span>
  </div>
  <div class="detail">
    <span class="label">{$_('db_name')}{staticText.COLON}</span>
    <span>{database.name}</span>
  </div>
</div>

<style lang="scss">
  .db-card-content {
    padding: 0.8rem;
    font-size: var(--text-size-large);
    display: grid;
    grid-template: auto auto / auto 1fr;
    align-items: center;
    gap: 0 0.5rem;
  }

  .circle {
    --size: 3rem;
    grid-row: span 3;
    background: var(--brand-500);
    color: var(--white);
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--size);
    width: var(--size);
    border-radius: 3rem;
  }

  .upgrade-required .circle {
    background: var(--slate-300);
  }

  .display-name {
    font-size: var(--text-size-xx-large);
    font-weight: var(--font-weight-medium);
  }

  .detail {
    font-size: var(--text-size-small);
    margin-top: var(--size-extreme-small);
  }
  .label {
    color: var(--slate-400);
  }
</style>
