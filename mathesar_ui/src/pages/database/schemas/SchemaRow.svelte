<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import DropdownMenu from '@mathesar/component-library/dropdown-menu/DropdownMenu.svelte';
  import MenuDivider from '@mathesar/component-library/menu/MenuDivider.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconMoreActions,
    iconExpandRight,
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

  $: ({ name, description, isPublicSchema, currentAccess } = schema);
  $: ({ currentRoleOwns } = currentAccess);

  let isHovered = false;
  let isFocused = false;

  $: href = getSchemaPageUrl(database.id, schema.oid);
</script>

<div class="schema-row" class:hover={isHovered} class:focus={isFocused}>
  <div class="top-row">
    <div class="icon-container">
      <Icon {...iconSchema} size="1rem" />
    </div>
    <div class="menu-trigger">
      <DropdownMenu
        showArrow={false}
        triggerAppearance="plain"
        preferredPlacement="bottom-end"
        icon={iconMoreActions}
        menuStyle="--Menu__padding-x:0.8em;"
      >
        <ButtonMenuItem
          on:click={() => dispatch('edit')}
          icon={iconEdit}
          disabled={!$currentRoleOwns}
        >
          {$_('edit_schema')}
        </ButtonMenuItem>
        <MenuDivider />
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

  <div class="content">
    <div class="name"><SchemaName {schema} /></div>

    {#if $description}
      <p class="description" title={$description}>
        {$description}
      </p>
    {:else}
      <div class="description-placeholder"></div>
    {/if}

    <div class="bottom-row">
      <div class="table-count">
        <Icon {...iconTable} size="1rem" />
        <SchemaConstituentCounts {schema} />
      </div>
    </div>
  </div>

  <!--
  {#if $isPublicSchema}
    <InfoBox>
      {$_('public_schema_info')}
    </InfoBox>
  {/if}
-->
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
    border: 1px solid var(--card-border);
    background: linear-gradient(
      var(--gradient-direction-default),
      var(--gradient-card-start),
      var(--gradient-card-end)
    );
    padding: 1rem;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    box-shadow: var(--card-active-shadow);
    transition: all 0.2s ease-in-out;
  }

  .schema-row.hover {
    border: 1px solid var(--card-hover-border);
    box-shadow: var(--card-hover-shadow);
    background: linear-gradient(
      var(--gradient-direction-hover),
      var(--gradient-card-hover-start),
      var(--gradient-card-hover-end)
    );
  }

  .schema-row.focus {
    outline: 2px solid var(--sand-400);
    outline-offset: 1px;
  }

  .schema-row.active {
    border-color: var(--stormy-400);
    box-shadow: var(--card-active-shadow);
    background: linear-gradient(
      var(--gradient-direction-active),
      var(--gradient-card-active-start),
      var(--gradient-card-active-end)
    );
  }

  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 0.125rem;
  }

  .icon-container {
    background-color: var(--icon-background);
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: var(--z-index-menu-trigger);
  }

  .content {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 0.125rem;
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
    font-size: var(--text-size-base);
    color: var(--text-color-secondary);
    margin-bottom: 0;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 1.5rem;
  }

  .description-placeholder {
    min-height: 1.5rem;
  }

  .bottom-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.25rem;
  }

  .table-count {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--text-color-tertiary);
    font-size: var(--text-size-small);
  }

  .name {
    font-size: var(--text-size-xx-large);
    font-weight: var(--font-weight-medium);
    overflow: hidden;
    color: var(--text-color-primary);
    margin-bottom: 0.125rem;
  }
</style>
