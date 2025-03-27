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
  <div class="icon-container">
    <Icon {...iconSchema} size="1.25rem" />
  </div>
  <div class="content">
    <div class="title-and-meta">
      <div class="name"><SchemaName {schema} /></div>

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

    {#if $description}
      <p class="description" title={$description}>
        {$description}
      </p>
    {/if}

    <SchemaConstituentCounts {schema} />
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
    border: 1px solid var(--sand-300);
    background-color: var(--background-color);
    padding: 1.5em;
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    height: 100%;
    width: 100%;
    min-height: 130px;
  }

  .schema-row.hover {
    border: 1px solid var(--stormy-300);
    box-shadow: var(--shadow-color) 0 2px 4px 0;
  }
  .schema-row.focus {
    outline: 2px solid var(--sand-400);
    outline-offset: 1px;
  }
  .schema-row.active {
    border-color: var(--stormy-400);
    box-shadow: var(--shadow-color) 0 1px 2px 0;
  }

  .icon-container {
    background-color: var(--icon-background);
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
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
    gap: 0.25rem;
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
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .title-and-meta {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
  }

  .name {
    font-size: var(--text-size-xx-large);
    font-weight: var(--font-weight-medium);
    overflow: hidden;
    color: var(--text-color-primary);
  }
</style>
