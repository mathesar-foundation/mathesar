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
    padding: 0.25rem 1rem;
    height: var(--header-height, 60px);
    background-color: var(--slate-800);
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
    color: var(--white);
    text-decoration: none;
  }
  .database-switcher a:hover {
    text-decoration: underline;
  }
</style>
