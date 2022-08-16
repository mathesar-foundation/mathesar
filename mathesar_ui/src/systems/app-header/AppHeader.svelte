<script lang="ts">
  import { Icon } from '@mathesar-component-library';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { iconUser } from '@mathesar/icons';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import DatabaseName from '@mathesar/components/DatabaseName.svelte';
  import Breadcrumb from './breadcrumb/Breadcrumb.svelte';

  $: database = $currentDatabase;
</script>

<header class="app-header">
  <div class="left">
    <Breadcrumb />
  </div>

  <div class="right">
    <div class="database-switcher">
      {#if database}
        <a href={getDatabasePageUrl(database.name)}>
          <DatabaseName {database} />
        </a>
      {/if}
    </div>
    <div class="user-switcher">
      <Icon {...iconUser} />
    </div>
  </div>
</header>

<style>
  .app-header {
    display: flex;
    justify-content: space-between;
    background: var(--color-gray-light);
    border-bottom: 1px solid var(--color-gray-dark);
    padding: 0.25rem;
  }

  .left {
    display: flex;
    align-items: center;
  }

  .right {
    display: flex;
    align-items: center;
  }

  .user-switcher {
    display: flex;
    align-items: center;
    background: var(--color-gray-medium);
    padding: 0.5rem;
    border-radius: 0.25rem;
    margin-left: 1rem;
  }

  .database-switcher a {
    color: var(--color-text-muted);
    text-decoration: none;
  }
  .database-switcher a:hover {
    text-decoration: underline;
    color: black;
  }
</style>
