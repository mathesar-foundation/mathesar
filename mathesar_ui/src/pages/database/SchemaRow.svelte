<script lang="ts">
  import {
    ButtonMenuItem,
    Icon,
    iconShowMore,
  } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { iconEdit, iconNotEditable, iconDelete } from '@mathesar/icons';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import DropdownMenu from '@mathesar/component-library/dropdown-menu/DropdownMenu.svelte';
  import { createEventDispatcher } from 'svelte';
  import MenuDivider from '@mathesar/component-library/menu/MenuDivider.svelte';
  import Alert from '@mathesar/component-library/alert/Alert.svelte';
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
        >
          <ButtonMenuItem on:click={() => dispatch('edit')} icon={iconEdit}
            >Edit Schema</ButtonMenuItem
          >
          <MenuDivider />
          <ButtonMenuItem
            danger
            on:click={() => dispatch('delete')}
            icon={iconDelete}>Delete Schema</ButtonMenuItem
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
      <Alert appearance="info">
        <slot slot="content">
          Every PostgreSQL database includes the "public" schema. This protected
          schema can be read by anybody who accesses the database.
        </slot>
      </Alert>
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
    font-size: 1.142rem;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .schema-row {
    border-radius: 0.57rem;
    padding: 1.142em;
    border: 1px solid var(--slate-300);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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
    font-size: var(--text-size-x-large);
  }

  .lock {
    color: var(--slate-300);
    align-self: baseline;
  }
</style>
