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
    <div class="user-switcher">
      <Icon {...iconUser} />
    </div>
    <div class="database-switcher">
      {#if database}
        <a href={getDatabasePageUrl(database.name)}>
          <DatabaseName {database} />
        </a>
      {/if}
    </div>
  </div>
</header>

<style>
  .app-header {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    background: #ddd;
    border-bottom: 1px solid #bbb;
  }

  .left {
    display: flex;
    align-items: center;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .database-switcher a {
    font-size: 0.85rem;
    color: #888;
    text-decoration: none;
  }
  .database-switcher a:hover {
    text-decoration: underline;
    color: black;
  }
</style>
