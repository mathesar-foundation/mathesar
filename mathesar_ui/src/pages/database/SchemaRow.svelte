<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { ButtonMenuItem, Icon } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import DropdownMenu from '@mathesar/component-library/dropdown-menu/DropdownMenu.svelte';
  import MenuDivider from '@mathesar/component-library/menu/MenuDivider.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconMoreActions,
    iconNotEditable,
  } from '@mathesar/icons';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import SchemaConstituentCounts from './SchemaConstituentCounts.svelte';

  const dispatch = createEventDispatcher();

  export let database: Database;
  export let schema: SchemaEntry;
  export let canExecuteDDL = true;

  let isHovered = false;
  let isFocused = false;

  $: href = getSchemaPageUrl(database.id, schema.id);
  $: isDefault = schema.name === 'public';
  $: isLocked = schema.name === 'public';
</script>

<div
  class="schema-row"
  class:hover={isHovered}
  class:focus={isFocused}
  class:is-locked={isLocked}
>
  <div class="title-and-meta">
    <div class="name"><SchemaName {schema} iconHasBox /></div>

    {#if isLocked}
      <div class="lock"><Icon {...iconNotEditable} /></div>
    {:else if canExecuteDDL}
      <div class="menu-trigger">
        <DropdownMenu
          showArrow={false}
          triggerAppearance="plain"
          preferredPlacement="bottom-end"
          icon={iconMoreActions}
          menuStyle="--spacing-y:0.8em;"
        >
          <ButtonMenuItem on:click={() => dispatch('edit')} icon={iconEdit}>
            {$_('edit_schema')}
          </ButtonMenuItem>
          <MenuDivider />
          <ButtonMenuItem
            danger
            on:click={() => dispatch('delete')}
            icon={iconDeleteMajor}
          >
            {$_('delete_schema')}
          </ButtonMenuItem>
        </DropdownMenu>
      </div>
    {/if}
  </div>

  {#if schema.description}
    <p class="description" title={schema.description}>
      {schema.description}
    </p>
  {/if}

  <SchemaConstituentCounts {schema} />

  {#if isDefault}
    <InfoBox>
      {$_('public_schema_info')}
    </InfoBox>
  {/if}

  <!-- svelte-ignore a11y-missing-content -->
  <a
    {href}
    class="hyperlink-overlay"
    aria-label={schema.name}
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

<style>
  .schema-row {
    position: relative;
    isolation: isolate;
    --z-index-hyperlink-overlay: 1;
    --z-index-menu-trigger: 2;
    border-radius: var(--border-radius-l);
    border: 1px solid var(--slate-200);
    background-color: var(--white);
    padding: 1.142em;
    display: flex;
    flex-direction: column;
  }

  .schema-row > :global(* + *:not(.hyperlink-overlay)) {
    margin-top: 0.75rem;
  }

  .schema-row.hover {
    border: 1px solid var(--slate-300);
    background-color: var(--slate-50);
    box-shadow: 0 0.2rem 0.4rem 0 rgba(0, 0, 0, 0.1);
  }
  .schema-row.focus {
    outline: 2px solid var(--slate-300);
    outline-offset: 1px;
  }

  .schema-row.is-locked {
    background-color: var(--slate-100);
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
    font-size: var(--text-size-large);
    color: var(--slate-700);
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
    align-items: center;
    flex-grow: 1;
  }

  .name {
    font-size: var(--text-size-x-large);
    font-weight: 500;
    --icon-color: var(--brand-500);
    overflow: hidden;
  }

  .lock {
    color: var(--slate-300);
    align-self: baseline;
  }
</style>
