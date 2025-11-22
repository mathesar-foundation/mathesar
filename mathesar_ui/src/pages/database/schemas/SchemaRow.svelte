<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import DropdownMenu from '@mathesar/component-library/dropdown-menu/DropdownMenu.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconMoreActions,
    iconSchema,
    iconTable,
  } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { ButtonMenuItem, Icon } from '@mathesar-component-library';

  import SchemaConstituentCounts from './SchemaConstituentCounts.svelte';

  const dispatch = createEventDispatcher();

  export let database: Database;
  export let schema: Schema;

  $: ({ name, description, currentAccess } = schema);
  $: ({ currentRoleOwns } = currentAccess);

  let isHovered = false;
  let isFocused = false;

  $: href = getSchemaPageUrl(database.id, schema.oid);
</script>

<div class="schema-row" class:hover={isHovered} class:focus={isFocused}>
  <div class="content">
    <div class="content-header">
      <div class="icon-container">
        <Icon {...iconSchema} size="1rem" />
      </div>
      <div class="name">{$name}</div>
      <div class="table-count">
        <Icon {...iconTable} size="1rem" />
        <SchemaConstituentCounts {schema} />
      </div>
      <div class="menu-trigger">
        <DropdownMenu
          showArrow={false}
          triggerAppearance="plain"
          preferredPlacement="bottom-end"
          icon={iconMoreActions}
        >
          <ButtonMenuItem
            on:click={() => dispatch('edit')}
            icon={iconEdit}
            disabled={!$currentRoleOwns}
          >
            {$_('rename_schema')}
          </ButtonMenuItem>
          <ButtonMenuItem
            danger
            on:click={() => dispatch('delete')}
            icon={iconDeleteMajor}
            disabled={!$currentRoleOwns}
          >
            {$_('delete_schema')}
          </ButtonMenuItem>
        </DropdownMenu>
      </div>
    </div>

    {#if $description}
      <p class="description" title={$description}>
        {$description}
      </p>
    {:else}
      <div class="description-placeholder"></div>
    {/if}
  </div>

  <!-- svelte-ignore a11y-missing-content -->
  <a
    {href}
    class="hyperlink-overlay"
    aria-label={$name}
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
</div>

<style lang="scss">
  .schema-row {
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

  .schema-row.hover {
    border: 1px solid var(--color-schema-40);
    background: var(--color-schema-5-active);
    box-shadow: var(--card-hover-box-shadow);
  }

  .schema-row:active,
  .schema-row.focus {
    outline: 2px solid var(--color-schema-15);
    border: 1px solid var(--color-schema-40);
    box-shadow: var(--card-focus-box-shadow);
  }

  .schema-row:active {
    background: var(--color-schema-10-active);
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
    gap: var(--sm2);
  }

  .icon-container {
    background: var(--color-schema-80);
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: var(--z-index-menu-trigger);
    color: var(--color-fg-light);
  }

  .hyperlink-overlay {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    z-index: var(--z-index-hyperlink-overlay);
  }

  .menu-trigger {
    z-index: var(--z-index-menu-trigger);
  }

  .description {
    font-weight: 400;
    font-size: 1rem;
    color: var(--color-fg-subtle-1);
    margin-bottom: 0;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .description-placeholder {
    min-height: 1.5rem;
  }

  .table-count {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--color-fg-subtle-2);
    font-size: var(--sm1);
    margin-left: auto;
    margin-right: var(--sm3);
  }

  .name {
    font-size: var(--lg2);
    font-weight: var(--font-weight-medium);
    color: var(--color-fg-base);
    flex: 1;
    word-break: break-word;
    hyphens: auto;
  }
</style>
