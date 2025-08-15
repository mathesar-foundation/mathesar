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
  import type { DataForm } from '@mathesar/models/DataForm';
  import {
    getDataFormFillPageUrl,
    getDataFormPageUrl,
  } from '@mathesar/routes/urls';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import { ButtonMenuItem, Icon } from '@mathesar-component-library';

  export let dataForm: DataForm;
  export let editDataForm: () => void;
  export let deleteDataForm: () => void;

  $: ({ id, structure, schema, baseTableOid } = dataForm);
  $: baseTable = $tablesStore.tablesMap.get(baseTableOid);

  $: builderPageUrl = getDataFormPageUrl(schema.database.id, schema.oid, id);
  $: formFilloutPageUrl = getDataFormFillPageUrl(
    schema.database.id,
    schema.oid,
    id,
  );

  function handleDelete() {
    void confirmDelete({
      identifierType: $_('form'),
      identifierName: $structure.name,
      onProceed: async () => {
        deleteDataForm();
      },
    });
  }
</script>

<EntityListItem
  href={builderPageUrl}
  name={$structure.name}
  description={$structure.description ?? undefined}
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
    <a href={formFilloutPageUrl} class="btn btn-secondary fill-out-button">
      <Icon {...iconFillOutForm} />
      <span>{$_('fill_out')}</span>
    </a>
  </div>
  <svelte:fragment slot="menu">
    <ButtonMenuItem on:click={editDataForm} icon={iconEdit}>
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
