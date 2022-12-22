<script lang="ts">
  import {
    ensureReadable,
    portalToWindowFooter,
  } from '@mathesar-component-library';
  import type { LinksPostRequest } from '@mathesar/api/types/links';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import { postAPI } from '@mathesar/api/utils/requestUtils';
  import {
    comboInvalidIf,
    Field,
    invalidIf,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import FieldLayout from '@mathesar/components/form/FieldLayout.svelte';
  import FormSubmitWithCatch from '@mathesar/components/form/FormSubmitWithCatch.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import OutcomeBox from '@mathesar/components/message-boxes/OutcomeBox.svelte';
  import SelectTable from '@mathesar/components/SelectTable.svelte';
  import { iconTableLink } from '@mathesar/icons';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import {
    ColumnsDataStore,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import {
    refetchTablesForSchema,
    tables as tablesDataStore,
    validateNewTableName,
  } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import {
    columnNameIsAvailable,
    getSuggestedFkColumnName,
  } from '@mathesar/utils/columnUtils';
  import { assertExhaustive } from '@mathesar/utils/typeUtils';
  import Pill from './LinkTablePill.svelte';
  import {
    columnNameIsNotId,
    suggestMappingTableName,
    type LinkType,
  } from './linkTableUtils';
  import NewColumn from './NewColumn.svelte';
  import SelectLinkType from './SelectLinkType.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let base: TableEntry;
  export let close: () => void;

  // ===========================================================================
  // Prerequisite data
  // ===========================================================================
  $: tables = [...$tablesDataStore.data.values()];
  $: ({ columnsDataStore } = $tabularData);
  $: baseColumns = columnsDataStore.columns;
  $: targetColumnsStore = target
    ? new ColumnsDataStore({ parentId: target.id })
    : undefined;
  $: targetColumns = ensureReadable(targetColumnsStore?.columns ?? []);
  $: targetColumnsFetchStatus = ensureReadable(targetColumnsStore?.fetchStatus);
  $: targetColumnsAreLoading =
    $targetColumnsFetchStatus?.state === 'processing';

  // ===========================================================================
  // Fields
  // ===========================================================================
  $: targetTable = requiredField<TableEntry | undefined>(undefined, [
    invalidIf(
      (t) => t.id === base.id,
      'Using this form to create self-referential links is not yet ' +
        'supported. You can manually create such links by creating the ' +
        'appropriate columns and adding foreign key constraints to ' +
        'those columns.',
    ),
  ]);
  $: target = $targetTable;
  $: linkType = requiredField<LinkType>('manyToOne');
  $: columnNameInBase = requiredField(
    getSuggestedFkColumnName(target, $baseColumns),
    [columnNameIsAvailable($baseColumns)],
  );
  $: columnNameInTarget = requiredField(
    getSuggestedFkColumnName(base, $targetColumns),
    [columnNameIsAvailable($targetColumns)],
  );
  $: mappingTableName = requiredField(
    suggestMappingTableName(base, target, tables),
    [$validateNewTableName],
  );
  $: columnNameMappingToBase = requiredField(getSuggestedFkColumnName(base), [
    columnNameIsNotId,
  ]);
  $: columnNameMappingToTarget = requiredField(
    getSuggestedFkColumnName(target),
    [columnNameIsNotId],
  );

  // ===========================================================================
  // Helper values
  // ===========================================================================
  $: isSelfReferential = base.id === target?.id;
  /**
   * Prevent form submission if we have not yet been able to suggest a name for
   * the the `columnNameInTarget` field (and thus have not yet received user
   * input for that field).
   */
  $: canProceed = !($linkType === 'manyToOne' && targetColumnsAreLoading);

  // ===========================================================================
  // Form
  // ===========================================================================
  $: form = (() => {
    const commonFields = { targetTable, linkType };
    if ($linkType === 'oneToMany') {
      return makeForm({ ...commonFields, columnNameInTarget });
    }
    if ($linkType === 'manyToOne') {
      return makeForm({ ...commonFields, columnNameInBase });
    }
    if ($linkType === 'manyToMany') {
      return makeForm(
        {
          ...commonFields,
          mappingTableName,
          columnNameMappingToBase,
          columnNameMappingToTarget,
        },
        [
          comboInvalidIf(
            [columnNameMappingToBase, columnNameMappingToTarget],
            ([a, b]) => a === b,
            'The two columns cannot have the same name.',
          ),
        ],
      );
    }
    return assertExhaustive($linkType);
  })();

  // ===========================================================================
  // Saving
  // ===========================================================================

  function getRequestBody(): LinksPostRequest {
    if (!target) {
      throw new Error('Unable to determine target table id.');
    }
    if ($linkType === 'oneToMany') {
      return {
        link_type: 'one-to-many',
        reference_table: target.id,
        reference_column_name: $columnNameInTarget,
        referent_table: base.id,
      };
    }
    if ($linkType === 'manyToOne') {
      return {
        link_type: 'one-to-many',
        reference_table: base.id,
        reference_column_name: $columnNameInBase,
        referent_table: target.id,
      };
    }
    if ($linkType === 'manyToMany') {
      return {
        link_type: 'many-to-many',
        mapping_table_name: $mappingTableName,
        referents: [
          {
            referent_table: base.id,
            column_name: $columnNameMappingToBase,
          },
          {
            referent_table: target.id,
            column_name: $columnNameMappingToTarget,
          },
        ],
      };
    }
    return assertExhaustive($linkType);
  }

  async function reFetchOtherThingsThatChanged() {
    if ($linkType === 'manyToMany' && $currentSchemaId !== undefined) {
      await refetchTablesForSchema($currentSchemaId);
      return;
    }
    const tableWithNewColumn = $linkType === 'oneToMany' ? target : base;
    if (!tableWithNewColumn) {
      return;
    }
    if (tableWithNewColumn.id === $tabularData.id) {
      await $tabularData.refresh();
    }
  }

  async function handleSave() {
    await postAPI('/api/db/v0/links/', getRequestBody());
    toast.success('The link has been created successfully');
    await reFetchOtherThingsThatChanged();
    close();
  }
</script>

<div class="form" class:self-referential={false}>
  <FieldLayout>
    <InfoBox>
      Links are stored in the database as foreign key constraints, which you may
      add to existing columns via the "Advanced" section of the table inspector.
    </InfoBox>
  </FieldLayout>

  <Field
    field={targetTable}
    input={{ component: SelectTable, props: { tables, autoSelect: 'none' } }}
  >
    <span slot="label">
      Link <Pill table={base} which="base" /> to
    </span>
  </Field>

  {#if target && !isSelfReferential}
    <SelectLinkType field={linkType} {base} {target} />

    <FieldLayout>
      <OutcomeBox>
        {#if $linkType === 'oneToMany'}
          <NewColumn
            base={target}
            target={base}
            field={columnNameInTarget}
            {targetColumnsAreLoading}
          />
        {:else if $linkType === 'manyToOne'}
          <NewColumn {base} {target} field={columnNameInBase} />
        {:else if $linkType === 'manyToMany'}
          <p>We'll create a new table.</p>
          <Field field={mappingTableName} label="Table Name" />
          {#if $mappingTableName}
            <NewColumn
              base={{ name: $mappingTableName }}
              baseWhich="mapping"
              target={base}
              targetWhich="base"
              field={columnNameMappingToBase}
            />
            <NewColumn
              base={{ name: $mappingTableName }}
              baseWhich="mapping"
              {target}
              field={columnNameMappingToTarget}
            />
          {/if}
        {:else}
          {assertExhaustive($linkType)}
        {/if}
      </OutcomeBox>
    </FieldLayout>
  {/if}
</div>

<div use:portalToWindowFooter>
  <FormSubmitWithCatch
    {form}
    {canProceed}
    onCancel={close}
    proceedButton={{ label: 'Create Link', icon: iconTableLink }}
    onProceed={handleSave}
  />
</div>

<style>
  .form {
    --base-fill: #f8dbf7;
    --base-stroke: #ff6cf0;
    --target-fill: #e9f9e8;
    --target-stroke: #4df223;
    --mapping-fill: #cdfafa;
    --mapping-stroke: #06e5e5;
    line-height: 1.6;
  }
  .form.self-referential {
    --that-table-color: var(--this-table-color);
  }
</style>
