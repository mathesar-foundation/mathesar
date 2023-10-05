<script lang="ts">
  import type { Database } from '@mathesar/AppTypes';
  import { Icon } from '@mathesar/component-library';
  import { iconNotEditable, iconEdit } from '@mathesar/icons';
  import { getDatabaseConnectionEditUrl } from '@mathesar/routes/urls';
  import { isSuccessfullyConnectedDatabase } from '@mathesar/utils/database';

  export let database: Database;

  $: rootElement = database.editable ? 'a' : 'div';
  $: rootElementProps = database.editable
    ? { href: getDatabaseConnectionEditUrl(database.name) }
    : { 'aria-disabled': true };
</script>

<svelte:element
  this={rootElement}
  class="connection-item passthrough"
  {...rootElementProps}
>
  {#if !database.editable}
    <span class="floating-icon">
      <Icon {...iconNotEditable} />
    </span>
  {:else}
    <span class="floating-icon">
      <Icon {...iconEdit} />
    </span>
  {/if}
  <p class="connection-name">{database.name}</p>
  {#if isSuccessfullyConnectedDatabase(database)}
    <p class="db-name">{database.db_name}</p>
  {/if}
</svelte:element>

<style lang="scss">
  .connection-item {
    border-radius: var(--border-radius-m);
    border: 1px solid var(--slate-200);

    position: relative;
    display: flex;
    flex-direction: column;

    padding: var(--size-base);

    > :global(* + *) {
      margin-top: var(--size-xx-small);
    }

    &:not([aria-disabled='true']) {
      cursor: pointer;
    }

    &:hover:not([aria-disabled='true']) {
      background: var(--slate-50);
    }
    &:focus:not([aria-disabled='true']) {
      background: var(--slate-100);
    }
  }

  .floating-icon {
    position: absolute;
    top: var(--size-base);
    right: var(--size-base);
  }

  .connection-name {
    font-size: var(--text-size-large);
  }

  .db-name {
    color: var(--slate-500);
  }

  p {
    margin: 0;
  }
</style>
