<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityListItem from '@mathesar/components/EntityListItem.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconFillOutForm,
    iconForm,
  } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { ButtonMenuItem, Icon } from '@mathesar-component-library';

  export let form: { id: number; name: string; description?: string | null };
  export let database: Database;
  export let schema: Schema;

  $: baseTable = { name: 'My Table' };

  $: builderPageUrl = '#TODO'; // TODO
  $: formPageUrl = '#TODO'; // TODO

  function handleDelete() {
    void confirmDelete({
      identifierType: $_('form'),
      identifierName: form.name,
      onProceed: async () => {
        // TODO
      },
    });
  }

  function handleEdit() {
    // TODO

    // eslint-disable-next-line no-console
    console.log({ database, schema, form });
  }
</script>

<EntityListItem
  href={builderPageUrl}
  name={form.name}
  description={form.description ?? undefined}
  icon={iconForm}
>
  <svelte:fragment slot="detail">
    {#if baseTable}
      <RichText text={$_('for_named_table')} let:slotName>
        {#if slotName === 'tableName'}
          <TableName table={baseTable} truncate={false} />
        {/if}
      </RichText>
    {/if}
  </svelte:fragment>
  <div slot="action-buttons">
    <a href={formPageUrl} class="btn btn-secondary fill-out-button">
      <Icon {...iconFillOutForm} />
      <span>{$_('fill_out')}</span>
    </a>
  </div>
  <svelte:fragment slot="menu">
    <ButtonMenuItem on:click={handleEdit} icon={iconEdit}>
      {$_('edit_form')}
    </ButtonMenuItem>
    <ButtonMenuItem on:click={handleDelete} danger icon={iconDeleteMajor}>
      {$_('delete_form')}
    </ButtonMenuItem>
  </svelte:fragment>
</EntityListItem>

<style>
  .fill-out-button {
    font-size: var(--sm1);
  }
</style>
