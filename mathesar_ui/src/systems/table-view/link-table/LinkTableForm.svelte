<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { LinksPostRequest } from '@mathesar/api/rest/types/links';
  import { postAPI } from '@mathesar/api/rest/utils/requestUtils';
  import type { Table } from '@mathesar/api/rpc/tables';
  import {
    Field,
    FieldLayout,
    type FilledFormValues,
    FormSubmit,
    comboInvalidIf,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import OutcomeBox from '@mathesar/components/message-boxes/OutcomeBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import SelectTable from '@mathesar/components/SelectTable.svelte';
  import { iconTableLink } from '@mathesar/icons';
  import { currentDatabase } from '@mathesar/stores/databases';
  import {
    ColumnsDataStore,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import {
    currentTables,
    importVerifiedTables as importVerifiedTablesStore,
    refetchTablesForCurrentSchema,
    validateNewTableName,
  } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import {
    columnNameIsAvailable,
    getSuggestedFkColumnName,
  } from '@mathesar/utils/columnUtils';
  import { getAvailableName } from '@mathesar/utils/db';
  import { makeSingular } from '@mathesar/utils/languageUtils';
  import {
    assertExhaustive,
    ensureReadable,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import Pill from './LinkTablePill.svelte';
  import {
    type LinkType,
    columnNameIsNotId,
    suggestMappingTableName,
  } from './linkTableUtils';
  import NewColumn from './NewColumn.svelte';
  import SelectLinkType from './SelectLinkType.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let base: Table;
  export let close: () => void;

  // ===========================================================================
  // Prerequisite data
  // ===========================================================================
  $: singularBaseTableName = makeSingular(base.name);
  $: importVerifiedTables = [...$importVerifiedTablesStore.values()];
  $: ({ columnsDataStore } = $tabularData);
  $: baseColumns = columnsDataStore.columns;

  // ===========================================================================
  // Fields
  // ===========================================================================
  $: targetTable = requiredField<Table | undefined>(undefined);
  $: target = $targetTable;
  $: isSelfReferential = base.oid === target?.oid;
  $: linkTypes = ((): LinkType[] =>
    isSelfReferential
      ? ['manyToOne', 'manyToMany']
      : ['manyToOne', 'oneToMany', 'manyToMany'])();
  $: linkType = requiredField<LinkType>('manyToOne');
  $: $targetTable, linkType.reset();
  $: targetColumnsStore = target
    ? new ColumnsDataStore({ database: $currentDatabase, table: target })
    : undefined;
  $: targetColumns = ensureReadable(targetColumnsStore?.columns ?? []);
  $: targetColumnsFetchStatus = ensureReadable(targetColumnsStore?.fetchStatus);
  $: targetColumnsAreLoading =
    $targetColumnsFetchStatus?.state === 'processing';
  $: columnNameInBase = requiredField(
    getSuggestedFkColumnName(target, $baseColumns),
    [columnNameIsAvailable($baseColumns)],
  );
  $: columnNameInTarget = requiredField(
    getSuggestedFkColumnName(base, $targetColumns),
    [columnNameIsAvailable($targetColumns)],
  );
  $: mappingTableName = requiredField(
    suggestMappingTableName(base, target, $currentTables),
    [$validateNewTableName],
  );
  $: columnNameMappingToBase = (() => {
    const initial = isSelfReferential
      ? getAvailableName(
          `${singularBaseTableName}_1`,
          new Set(['id', singularBaseTableName]),
        )
      : getSuggestedFkColumnName(base);
    return requiredField(initial, [columnNameIsNotId()]);
  })();
  $: columnNameMappingToTarget = (() => {
    const initial = isSelfReferential
      ? getAvailableName(
          `${singularBaseTableName}_2`,
          new Set(['id', singularBaseTableName]),
        )
      : getSuggestedFkColumnName(target);
    return requiredField(initial, [columnNameIsNotId()]);
  })();

  // ===========================================================================
  // Helper values
  // ===========================================================================
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
            $_('two_columns_cannot_have_same_name'),
          ),
        ],
      );
    }
    return assertExhaustive($linkType);
  })();

  // ===========================================================================
  // Saving
  // ===========================================================================

  function getRequestBody(
    values: FilledFormValues<typeof form>,
  ): LinksPostRequest {
    if ($linkType === 'oneToMany') {
      return {
        link_type: 'one-to-many',
        reference_table: values.targetTable.oid,
        reference_column_name: $columnNameInTarget,
        referent_table: base.oid,
      };
    }
    if ($linkType === 'manyToOne') {
      return {
        link_type: 'one-to-many',
        reference_table: base.oid,
        reference_column_name: $columnNameInBase,
        referent_table: values.targetTable.oid,
      };
    }
    if ($linkType === 'manyToMany') {
      return {
        link_type: 'many-to-many',
        mapping_table_name: $mappingTableName,
        referents: [
          {
            referent_table: base.oid,
            column_name: $columnNameMappingToBase,
          },
          {
            referent_table: values.targetTable.oid,
            column_name: $columnNameMappingToTarget,
          },
        ],
      };
    }
    return assertExhaustive($linkType);
  }

  async function reFetchOtherThingsThatChanged() {
    if ($linkType === 'manyToMany') {
      await refetchTablesForCurrentSchema();
      return;
    }
    const tableWithNewColumn = $linkType === 'oneToMany' ? target : base;
    if (!tableWithNewColumn) {
      return;
    }
    if (tableWithNewColumn.oid === $tabularData.table.oid) {
      await $tabularData.refresh();
    }
  }

  async function handleSave(values: FilledFormValues<typeof form>) {
    await postAPI('/api/db/v0/links/', getRequestBody(values));
    toast.success('The link has been created successfully');
    await reFetchOtherThingsThatChanged();
    close();
  }
</script>

<div class="description">
  Use links to connect related tables in your database, automatically setting up the necessary foreign key columns.
</div>

<div class="form" class:self-referential={isSelfReferential}>

  <FieldLayout>
    <InfoBox fullWidth={true}>
      {$_('links_info')}
    </InfoBox>
  </FieldLayout>

  <Field
    field={targetTable}
    input={{
      component: SelectTable,
      props: { tables: importVerifiedTables, autoSelect: 'none' },
    }}
  >
    <span slot="label">
      <RichText text={$_('link_table_to')} let:slotName>
        {#if slotName === 'tablePill'}
          <Pill table={base} which="base" />
        {/if}
      </RichText>
    </span>
  </Field>

  {#if target}
    <SelectLinkType
      field={linkType}
      {isSelfReferential}
      {linkTypes}
      {base}
      {target}
    />

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
          {#if isSelfReferential}
          <p>
            <RichText
              text={'We will create a new table [mappingTable].'}
              let:slotName
            >
              {#if slotName === 'mappingTable'}
                <Pill table={{ name: $mappingTableName }} which="mapping" />
              {:else if slotName === 'targetTable'}
                <Pill table={target} which="target" />
              {:else if slotName === 'baseTable'}
                <Pill table={base} which="base" />
              {/if}
            </RichText>
          </p>
            <Field
              field={mappingTableName}
              label={'Name of New Table'}
            >
              <span slot="help">
                The table that will store the many-to-many relationship between records of this table.
              </span>
            </Field>
            {#if $mappingTableName}
          
              <Field
                field={columnNameMappingToBase}
                label={$_('Name of New Column {number}', { values: { number: 1 } })}
              >
                <span slot="help">
                  The column in <Pill table={{ name: $mappingTableName }} which="mapping" /> that will link to <Pill table={base} which="base" />.
                </span>
              </Field>
              <Field
                field={columnNameMappingToTarget}
                label={$_('Name of New Column {number}', { values: { number: 2 } })}
              >
                <span slot="help">
                  The column in <Pill table={{ name: $mappingTableName }} which="mapping" /> that will link to <Pill table={target} which="target" />.
                </span>
              </Field>
            {/if}
          {:else}
            {#if $mappingTableName}
              <p>
                <RichText
                  text={'We will create a new table [mappingTable].'}
                  let:slotName
                >
                  {#if slotName === 'mappingTable'}
                    <Pill table={{ name: $mappingTableName }} which="mapping" />
                  {:else if slotName === 'targetTable'}
                    <Pill table={target} which="target" />
                  {:else if slotName === 'baseTable'}
                    <Pill table={base} which="base" />
                  {/if}
                </RichText>
              </p>
            {/if}
            <Field
              field={mappingTableName}
              label={'Name of New Table'}
            >
              <span slot="help">
                The table that will store the many-to-many relationship between records of the two tables.
              </span>
            </Field>
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
          {/if}
        {:else}
          {assertExhaustive($linkType)}
        {/if}
      </OutcomeBox>
    </FieldLayout>
  {/if}
</div>

<div use:portalToWindowFooter>
  <FormSubmit
    {form}
    catchErrors
    {canProceed}
    onCancel={close}
    proceedButton={{ label: $_('create_link'), icon: iconTableLink }}
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
    --target-fill: var(--base-fill);
    --target-stroke: var(--base-stroke);
  }
  .description {
    margin-bottom: 1rem;
  }
  :global(.form .outcome-box .labeled-input.layout-inline .label-content) {
    align-items: flex-start;
  }
  :global(.form .outcome-box .label) {
    width: 12rem;
  }
  :global(.form .outcome-box .label-content .input) {
    flex-grow: 1; 
  }
</style>
