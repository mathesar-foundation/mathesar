<script lang="ts">
  import { iconDatabase } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import { Icon } from '@mathesar-component-library';

  export let database: Database;
  export let upgradeRequired = false;

  $: server = `${database.server.host}:${database.server.port}`;
</script>

<div class="db-card-content" class:upgrade-required={upgradeRequired}>
  <div class="circle"><Icon {...iconDatabase} size="1.1rem" /></div>
  <div class="name">{database.name}</div>
  <div class="server">{server}</div>
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
    grid-row: span 2;
    background: var(--brand-500);
    color: var(--white);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.8rem;
    width: 2.8rem;
    border-radius: 3rem;
    border: 2px solid rgba(226, 211, 177, 0.5);
  }

  .upgrade-required .circle {
    background: var(--slate-300);
  }

  .name {
    font-size: var(--text-size-xx-large);
    font-weight: var(--font-weight-medium);
  }

  .server {
    font-size: var(--text-size-base);
    margin-top: var(--size-extreme-small);
    color: var(--slate-500);
  }
</style>
