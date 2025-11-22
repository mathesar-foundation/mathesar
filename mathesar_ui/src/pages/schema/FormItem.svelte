<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityListItem from '@mathesar/components/EntityListItem.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    iconDeleteMajor,
    iconEdit,
    iconForm,
    iconPubliclyShared,
  } from '@mathesar/icons';
  import type { DataForm } from '@mathesar/models/DataForm';
  import { getDataFormPageUrl, getFormShareUrl } from '@mathesar/routes/urls';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import {
    AnchorButton,
    ButtonMenuItem,
    Icon,
    Tooltip,
  } from '@mathesar-component-library';

  export let dataForm: DataForm;
  export let editDataForm: () => void;
  export let deleteDataForm: () => void;

  $: ({ id, structure, schema, baseTableOid, sharePreferences, token } =
    dataForm);
  $: baseTable = $tablesStore.tablesMap.get(baseTableOid);
  $: builderPageUrl = getDataFormPageUrl(schema.database.id, schema.oid, id);

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
  cssVariables={{
    '--EntityListItem__accent-color': 'var(--color-data-form-80)',
  }}
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
  <svelte:fragment slot="action-buttons">
    {#if $sharePreferences.isPublishedPublicly}
      <Tooltip>
        <AnchorButton
          slot="trigger"
          appearance="plain"
          href={`${window.location.origin}${getFormShareUrl($token)}`}
        >
          <Icon {...iconPubliclyShared} size="0.9rem" />
        </AnchorButton>
        <span slot="content">
          {$_('form_is_shared_publicly')}
        </span>
      </Tooltip>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="menu">
    <ButtonMenuItem on:click={editDataForm} icon={iconEdit}>
      {$_('rename_form')}
    </ButtonMenuItem>
    <ButtonMenuItem on:click={handleDelete} danger icon={iconDeleteMajor}>
      {$_('delete_form')}
    </ButtonMenuItem>
  </svelte:fragment>
</EntityListItem>
