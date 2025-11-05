<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    iconDatabase,
    iconDeleteMajor,
    iconEdit,
    iconMoreActions,
    iconReinstall,
    iconRequiresUpgrade,
  } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    Button,
    ButtonMenuItem,
    DropdownMenu,
    Icon,
  } from '@mathesar-component-library';

  export let database: Database;
  export let href: string;
  export let openDisconnect: () => void;
  export let openEdit: () => void;
  export let openReinstall: () => void;
  export let upgradeRequired = false;
  export let onTriggerUpgrade: ((database: Database) => void) | undefined =
    undefined;

  const userProfileStore = getUserProfileStoreFromContext();
  $: ({ isMathesarAdmin } = $userProfileStore);

  $: showDbName = database.name !== database.displayName;
  $: server = database.server.getConnectionString();

  let isHovered = false;
  let isFocused = false;
</script>

<div
  class="db-card-content"
  class:hover={isHovered}
  class:focus={isFocused}
  class:upgrade-required={upgradeRequired}
>
  <div class="content">
    <div class="content-header">
      <div class="icon-container">
        <Icon {...iconDatabase} size="1.25rem" class="database-icon" />
      </div>
      <div class="name-and-detail">
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
      {#if upgradeRequired && onTriggerUpgrade}
        <div class="upgrade-actions">
          <div class="indicator">
            <Icon {...iconRequiresUpgrade} />
            {$_('upgrade_required')}
          </div>
          <Button on:click={() => onTriggerUpgrade?.(database)}>
            {$_('upgrade')}
          </Button>
        </div>
      {/if}
      {#if isMathesarAdmin}
        <div class="menu-trigger">
          <DropdownMenu
            showArrow={false}
            triggerAppearance="plain"
            preferredPlacement="bottom-end"
            icon={iconMoreActions}
          >
            <ButtonMenuItem icon={iconEdit} on:click={openEdit}>
              {$_('edit_connection')}
            </ButtonMenuItem>
            <ButtonMenuItem icon={iconReinstall} on:click={openReinstall}>
              {$_('reinstall_mathesar_schemas')}
            </ButtonMenuItem>
            <ButtonMenuItem icon={iconDeleteMajor} on:click={openDisconnect}>
              {$_('disconnect_database')}
            </ButtonMenuItem>
          </DropdownMenu>
        </div>
      {/if}
    </div>
  </div>

  {#if !upgradeRequired}
    <!-- svelte-ignore a11y-missing-content -->
    <a
      {href}
      class="hyperlink-overlay"
      aria-label={`Open database ${database.displayName}`}
      on:mouseenter={() => {
        isHovered = true;
      }}
      on:mouseleave={() => {
        isHovered = false;
      }}
      on:focusin={() => {
        isFocused = true;
      }}
      on:focusout={() => {
        isFocused = false;
      }}
    />
  {/if}
</div>

<style lang="scss">
  .db-card-content {
    position: relative;
    isolation: isolate;
    --z-index-hyperlink-overlay: 1;
    --z-index-menu-trigger: 2;
    border-radius: var(--border-radius-l);
    border: 1px solid var(--card-border-color);
    background-color: var(--card-background);
    padding: var(--lg1);
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    outline-offset: 1px;
  }

  .db-card-content.upgrade-required {
    background: var(--color-navigation-20-hover);
  }

  .db-card-content.hover:not(.upgrade-required) {
    border: 1px solid var(--color-database-40);
    background: var(--color-database-5-active);
    box-shadow: var(--card-hover-box-shadow);
  }

  .db-card-content:active:not(.upgrade-required),
  .db-card-content.focus:not(.upgrade-required) {
    outline: 2px solid var(--color-database-15);
    border: 1px solid var(--color-database-40);
    box-shadow: var(--card-focus-box-shadow);
  }

  .db-card-content:active:not(.upgrade-required) {
    background: var(--color-database-10-active);
  }

  .content {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-width: 0;
  }

  .content-header {
    display: flex;
    align-items: center;
    gap: var(--lg2);
  }

  .icon-container {
    background: var(--color-database-40);
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: var(--z-index-menu-trigger);
  }

  .name-and-detail {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .display-name {
    font-size: var(--lg2);
    font-weight: var(--font-weight-medium);
    color: var(--color-fg-base);
  }

  .db-name {
    font-size: var(--lg1);
    font-weight: var(--font-weight-normal);
    color: var(--color-fg-subtle-1);
  }

  .detail {
    font-size: 1rem;
    color: var(--color-fg-subtle-1);
  }

  .upgrade-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: var(--z-index-menu-trigger);
  }

  .indicator {
    color: var(--color-fg-warning);
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 1rem;
  }

  .menu-trigger {
    z-index: var(--z-index-menu-trigger);
  }

  .hyperlink-overlay {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    z-index: var(--z-index-hyperlink-overlay);
  }
</style>
