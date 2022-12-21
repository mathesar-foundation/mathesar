<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import {
    ButtonMenuItem,
    Icon,
    iconShowMore,
  } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import DropdownMenu from '@mathesar/component-library/dropdown-menu/DropdownMenu.svelte';
  import MenuDivider from '@mathesar/component-library/menu/MenuDivider.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import { iconDeleteMajor, iconEdit, iconNotEditable } from '@mathesar/icons';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import SchemaConstituentCounts from './SchemaConstituentCounts.svelte';

  const dispatch = createEventDispatcher();

  export let database: Database;
  export let schema: SchemaEntry;

  $: href = getSchemaPageUrl(database.name, schema.id);
  $: isDefault = schema.name === 'public';
  $: isLocked = schema.name === 'public';
</script>

<a {href} class="schema-details-link">
  <div class="schema-row" class:is-locked={isLocked}>
    <div class="title-and-meta">
      <span class="name"><SchemaName {schema} iconHasBox /></span>

      {#if isLocked}
        <span class="lock"><Icon {...iconNotEditable} /></span>
      {:else}
        <DropdownMenu
          showArrow={false}
          triggerAppearance="plain"
          closeOnInnerClick={true}
          label=""
          icon={iconShowMore}
          menuStyle="--spacing-y:0.8em;"
        >
          <ButtonMenuItem on:click={() => dispatch('edit')} icon={iconEdit}
            >Edit Schema</ButtonMenuItem
          >
          <MenuDivider />
          <ButtonMenuItem
            danger
            on:click={() => dispatch('delete')}
            icon={iconDeleteMajor}>Delete Schema</ButtonMenuItem
          >
        </DropdownMenu>
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
        Every PostgreSQL database includes the "public" schema. This protected
        schema can be read by anybody who accesses the database.
      </InfoBox>
    {/if}
  </div>
</a>

<style lang="scss">
  .schema-details-link {
    text-decoration: none;
    color: inherit;
  }

  .description {
    font-weight: 400;
    font-size: var(--text-size-large);
    color: var(--slate-700);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;

  }

  .schema-row {
    border-radius: 0.57rem;
    padding: 1em;
    border: 1px solid var(--slate-300);
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s ease-in-out;
    

    > :global(* + *) {
      margin-top: 0.25rem;
    }
  }

  .schema-row:hover {
    border-color: var(--slate-500);
    box-shadow: 0 0.2rem 0.4rem 0 rgba(0, 0, 0, 0.1);
  }

  .schema-row.is-locked {
    background-color: var(--slate-100);
  }

  .title-and-meta {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  
  .name {
    font-size: var(--text-size-xx-large);
    font-weight: 500;
    --icon-color: var(--brand-500);
  }

  .lock {
    color: var(--slate-300);
    align-self: baseline;
  }
</style>
