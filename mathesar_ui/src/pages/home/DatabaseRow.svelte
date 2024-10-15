<script lang="ts">
  import Card from '@mathesar/components/Card.svelte';
  import { iconDatabase } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import { Icon } from '@mathesar-component-library';

  export let database: Database;
</script>

<Card
  href={getDatabasePageUrl(database.id)}
  cssVariables={{
    '--Card__padding-v': '1.4rem',
  }}
>
  <div class="title">
    <div class="icon-holder">
      <div class="circle">
        <Icon {...iconDatabase} size="1.1rem" />
      </div>
    </div>
    <div class="content">
      <div class="name">{database.name}</div>
      <div class="server">{database.server.host}:{database.server.port}</div>
    </div>
  </div>
</Card>

<style lang="scss">
  .title {
    display: grid;
    width: 100%;
    grid-template-columns: 3.5rem 1fr;
  }
  .icon-holder {
    display: flex;
    align-items: center;
    justify-content: center;

    .circle {
      background: var(--brand-500);
      color: var(--white);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 2.8rem;
      width: 2.8rem;
      border-radius: 3rem;
      border: 2px solid rgba(226, 211, 177, 0.5);
    }
  }
  .content {
    padding-left: var(--size-ultra-small);

    .name {
      font-size: var(--text-size-xx-large);
      font-weight: var(--font-weight-medium);
    }

    .server {
      font-size: var(--text-size-base);
      margin-top: var(--size-extreme-small);
      color: var(--slate-500);
    }
  }
</style>
