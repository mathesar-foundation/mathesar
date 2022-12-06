<script lang="ts">
  import {
    DropdownMenu,
    Icon,
    LinkMenuItem,
  } from '@mathesar-component-library';
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
    <DropdownMenu
      triggerAppearance="ghost"
      size="small"
      closeOnInnerClick={true}
      label="Shortcuts"
    >
      <!-- TODO: Show shortcuts -->
    </DropdownMenu>
    <DropdownMenu
      triggerAppearance="ghost"
      size="small"
      closeOnInnerClick={true}
      label=""
      icon={iconUser}
    >
      <div class="user-switcher" slot="trigger">
        <Icon {...iconUser} />
      </div>
      {#if database}
        <LinkMenuItem href={getDatabasePageUrl(database.name)}>
          <div class="database-name">
            <span class="database-title">Database</span>
            <DatabaseName {database} />
          </div>
        </LinkMenuItem>
      {/if}
      <!-- TODO: Create an issue for saving and showing username in FE -->
    </DropdownMenu>
  </div>
</header>

<style lang="scss">
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
    color: var(--white);
    font-size: var(--text-size-large);
  }

  .user-switcher {
    background-color: var(--slate-200);
    color: var(--slate-800);
    border-radius: var(--border-radius-m);
    padding: 0.5rem;
    display: flex;
    align-items: center;
  }

  .database-name {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
