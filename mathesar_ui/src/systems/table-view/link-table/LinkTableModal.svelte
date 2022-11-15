<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ModalController } from '@mathesar-component-library';
  import {
    CancelOrProceedButtonPair,
    ControlledModal,
    ensureReadable,
    Help,
    Icon,
    LabeledInput,
    RadioGroup,
    Spinner,
    TextInput,
  } from '@mathesar-component-library';
  import type {
    LinksPostRequest,
    OneToOne,
    OneToMany,
    ManyToMany,
  } from '@mathesar/api/links';
  import type { TableEntry } from '@mathesar/api/tables';
  import Form from '@mathesar/components/Form.svelte';
  import FormField from '@mathesar/components/FormField.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { refetchTablesForSchema, tables } from '@mathesar/stores/tables';
  import {
    ColumnsDataStore,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { postAPI } from '@mathesar/utils/api';
  import { getAvailableName } from '@mathesar/utils/db';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { iconTechnicalExplanation, iconTableLink } from '@mathesar/icons';
  import type { RelationshipType } from './linkTableUtils';
  import {
    getRelationshipType,
    getRelationshipTypeName,
    makeFkColumnName,
  } from './linkTableUtils';
  import RelationshipDiagram from './RelationshipDiagram.svelte';
  import TableName from './TableName.svelte';

  const dispatch = createEventDispatcher();
  const tabularData = getTabularDataStoreFromContext();

  export let controller: ModalController;

  // Terminology within variable names here:
  //
  // - "this" refers to the table we were viewing before opening the modal.
  // - "that" refers to the table the user has selected in the 1st question.

  let thatTable: TableEntry | undefined;
  let thisHasManyOfThat: boolean | undefined;
  let thatHasManyOfThis: boolean | undefined;
  let mappingTableName = '';
  /** Name of new column in "this" table */
  let thisNewColumnName = '';
  /** Name of new column in "that" table */
  let thatNewColumnName = '';
  /** Name of column in the mapping table which references "this" table */
  let mappingToThisColumnName = '';
  /** Name of column in the mapping table which references "that" table */
  let mappingToThatColumnName = '';

  /**
   * It's annoying that `thisTable` can be `undefined`, but this situation
   * actually does happen when adding a new table via copy-paste CSV data
   * because we open a tab for the table (and mount this component in the
   * process) before the entry for the table is set into the `$tables` store.
   */
  $: thisTable = $tables.data.get($tabularData.id);
  $: isSelfReferential =
    thisTable !== undefined &&
    thatTable !== undefined &&
    thisTable.id === thatTable.id;
  $: unavailableTableNames = new Set(
    [...$tables.data.values()].map((t) => t.name),
  ); // TODO: include constraint names too
  $: ({ columnsDataStore } = $tabularData);
  $: ({ columns } = columnsDataStore);
  $: namesOfColumnsInThisTable = new Set($columns.map((c) => c.name));
  $: thatTableColumnsStore = thatTable
    ? new ColumnsDataStore({ parentId: thatTable.id })
    : undefined;
  $: thatTableColumns = ensureReadable(thatTableColumnsStore?.columns);
  $: thatTableColumnsFetchStatus = ensureReadable(
    thatTableColumnsStore?.fetchStatus,
  );
  $: thatTableColumnsAreLoading =
    $thatTableColumnsFetchStatus?.state === 'processing';
  $: namesOfColumnsInThatTable = new Set(
    ($thatTableColumns ?? []).map((c) => c.name),
  );

  function init() {
    thatTable = undefined;
    thisHasManyOfThat = undefined;
    thatHasManyOfThis = undefined;
  }

  function handleChangeThatTable(_thatTable: TableEntry | undefined) {
    thisHasManyOfThat = undefined;
    thatHasManyOfThis = undefined;
    mappingTableName = getAvailableName(
      `${(thisTable?.name ?? '') as string}_${_thatTable?.name ?? ''}`,
      unavailableTableNames,
    );
  }
  $: handleChangeThatTable(thatTable);

  $: relationshipType = getRelationshipType(
    thisHasManyOfThat,
    thatHasManyOfThis,
    isSelfReferential,
  );

  function setColumnNames(
    _relationshipType: RelationshipType | undefined,
    _namesOfColumnsInThatTable: Set<string>,
  ) {
    if (!thatTable) {
      return;
    }
    switch (_relationshipType) {
      case 'many-to-many':
        mappingToThisColumnName = makeFkColumnName(thisTable?.name ?? '');
        mappingToThatColumnName = makeFkColumnName(thatTable.name);
        break;
      case 'one-to-many':
        thatNewColumnName = makeFkColumnName(
          thisTable?.name ?? '',
          _namesOfColumnsInThatTable,
        );
        break;
      case 'many-to-one':
      case 'one-to-one':
        thisNewColumnName = makeFkColumnName(
          thatTable.name,
          namesOfColumnsInThisTable,
        );
        break;
      default:
        break;
    }
  }
  $: setColumnNames(relationshipType, namesOfColumnsInThatTable);

  function getRequestBody(): LinksPostRequest {
    if (!thisTable) {
      throw new Error('Unable to determine base table id.');
    }
    if (!thatTable) {
      throw new Error('Unable to determine target table id.');
    }
    switch (relationshipType) {
      case 'one-to-many': {
        const oneToOneOrOneToMany: OneToOne | OneToMany = {
          link_type: relationshipType,
          reference_table: thatTable.id,
          reference_column_name: thatNewColumnName,
          referent_table: thisTable.id,
        };
        return oneToOneOrOneToMany;
      }
      case 'one-to-one':
      case 'many-to-one': {
        const oneToMany: OneToMany = {
          link_type: 'one-to-many',
          reference_table: thisTable.id,
          reference_column_name: thisNewColumnName,
          referent_table: thatTable.id,
        };
        return oneToMany;
      }
      case 'many-to-many': {
        const manyToMany: ManyToMany = {
          link_type: relationshipType,
          mapping_table_name: mappingTableName,
          referents: [
            {
              referent_table: thisTable.id,
              column_name: mappingToThisColumnName,
            },
            {
              referent_table: thatTable.id,
              column_name: mappingToThatColumnName,
            },
          ],
        };
        return manyToMany;
      }
      default:
        throw new Error('Unknown relationship type.');
    }
  }

  async function reFetchOtherThingsThatChanged() {
    if (relationshipType === 'many-to-many' && $currentSchemaId !== undefined) {
      await refetchTablesForSchema($currentSchemaId);
      return;
    }
    const tableWithNewColumn =
      relationshipType === 'one-to-many' ? thatTable : thisTable;
    if (!tableWithNewColumn) {
      return;
    }
    if (tableWithNewColumn.id === $tabularData.id) {
      void $tabularData.refresh();
    }
  }

  async function handleSave() {
    try {
      await postAPI('/api/db/v0/links/', getRequestBody());
      await reFetchOtherThingsThatChanged();
      controller.close();
      toast.success('Link created.');
    } catch (e) {
      toast.error(`Unable to create link. ${getErrorMessage(e)}`);
    }
  }

  function goToConstraints() {
    controller.close();
    dispatch('goToConstraints');
  }

  const yesNoMixin = {
    options: [true, false],
    getRadioLabel: (value: boolean) => (value ? 'Yes' : 'No'),
  };

  $: handleTableNameError = (tableName: string) => {
    const sameTableNameExist = [...$tables.data.values()]
      .map((t) => t.name)
      .findIndex((item) => item === tableName);
    if (sameTableNameExist >= 0) {
      return ['Table names must be unique.'];
    }
    if (tableName.length === 0) {
      return ['The Field cannot be empty.'];
    }
    return [];
  };

  $: handleColumnErrors = (columnName: string, whichTable: string) => {
    if (whichTable === 'this') {
      const sameNameExist = $columns.findIndex(
        (item) => item.name === columnName,
      );

      if (sameNameExist >= 0) return ['Column name must be unique.'];
    }

    if (whichTable === 'that' && $thatTableColumns !== undefined) {
      const sameNameExist = $thatTableColumns.findIndex(
        (item) => item.name === columnName,
      );

      if (sameNameExist >= 0) return ['Column name must be unique.'];
    }

    if (columnName.length === 0) return ['The Field cannot be empty.'];

    return [];
  };

  $: areFieldsFilled = () => {
    // check if table is chosen
    if (thatTable === undefined) return false;
    // check if checkboxes are filled
    if (thisHasManyOfThat === undefined) return false;
    if (!isSelfReferential && thatHasManyOfThis === undefined) return false;

    // check if currently shown fields are empty
    if (!isSelfReferential && thisHasManyOfThat && thatHasManyOfThis) {
      if (
        mappingTableName.length === 0 ||
        mappingToThisColumnName.length === 0 ||
        mappingToThatColumnName.length === 0
      ) {
        return false;
      }
    }

    if (!isSelfReferential && thisHasManyOfThat && !thatHasManyOfThis) {
      if (thatNewColumnName.length === 0) return false;
    }

    if (!isSelfReferential && !thisHasManyOfThat && thatHasManyOfThis) {
      if (thisNewColumnName.length === 0) return false;
    }

    if (!isSelfReferential && !thisHasManyOfThat && !thatHasManyOfThis) {
      if (thisNewColumnName.length === 0) return false;
    }

    if (isSelfReferential && !thisHasManyOfThat) {
      if (thisNewColumnName.length === 0) return false;
    }

    if (isSelfReferential && thisHasManyOfThat) {
      if (
        mappingTableName.length === 0 ||
        mappingToThisColumnName.length === 0 ||
        mappingToThatColumnName.length === 0
      ) {
        return false;
      }
    }

    // return true if all currently shown field are filled
    return true;
  };
</script>

<ControlledModal {controller} on:open={init} size="large">
  <div slot="title">
    Link <Identifier>{thisTable?.name}</Identifier> to Another Table
    <Help>
      <p>Associate records from this table with records from another table.</p>
      <p>
        If you prefer to manually configure a foreign key, go to
        <span class="link" on:click={goToConstraints}>
          constraints settings
        </span>.
      </p>
    </Help>
  </div>

  <div class="form" class:self-referential={isSelfReferential}>
    <Form>
      <FormField>
        <LabeledInput label="Link to Table">
          <SelectTableWithinCurrentSchema bind:table={thatTable} prependBlank />
        </LabeledInput>
      </FormField>

      {#if thatTable}
        <FormField>
          <div class="relationships">
            <div>
              <FormField>
                <RadioGroup
                  {...yesNoMixin}
                  bind:value={thisHasManyOfThat}
                  isInline
                >
                  Can one
                  <TableName name={thisTable?.name} which="this" />
                  record have multiple
                  <TableName name={thatTable.name} which="that" />
                  records?
                </RadioGroup>
              </FormField>

              {#if !isSelfReferential}
                <FormField>
                  <RadioGroup
                    {...yesNoMixin}
                    bind:value={thatHasManyOfThis}
                    isInline
                  >
                    Can one
                    <TableName name={thatTable.name} which="that" />
                    record have multiple
                    <TableName name={thisTable?.name} which="this" />
                    records?
                  </RadioGroup>
                </FormField>
              {/if}
            </div>
            <div>
              {#if relationshipType}
                <div class="diagram-column">
                  <div class="relationship-type-name">
                    "{getRelationshipTypeName(relationshipType)}"
                  </div>
                  <div class="diagram">
                    <RelationshipDiagram type={relationshipType} />
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </FormField>
      {/if}

      {#if relationshipType && thatTableColumnsAreLoading}
        <Spinner />
      {:else if relationshipType}
        <FormField>
          <div class="under-the-hood">
            <div class="title">
              <Icon {...iconTechnicalExplanation} /> Under the hood
            </div>

            {#if relationshipType === 'many-to-many'}
              <FormField errors={handleTableNameError(mappingTableName)}>
                <LabeledInput
                  label="We will create a new mapping table named:"
                  layout="stacked"
                >
                  <TextInput bind:value={mappingTableName} />
                </LabeledInput>
              </FormField>
              {#if mappingTableName.length > 0}
                <FormField
                  errors={handleColumnErrors(mappingToThisColumnName, 'this')}
                >
                  <LabeledInput layout="stacked">
                    <div slot="label">
                      Each
                      <TableName name={mappingTableName} which="mapping" />
                      record will reference one
                      <TableName name={thisTable?.name} which="this" />
                      record using a column named:
                    </div>
                    <TextInput bind:value={mappingToThisColumnName} />
                  </LabeledInput>
                </FormField>
                <FormField
                  errors={handleColumnErrors(mappingToThatColumnName, 'that')}
                >
                  <LabeledInput layout="stacked">
                    <div slot="label">
                      Each
                      <TableName name={mappingTableName} which="mapping" />
                      record will reference one
                      <TableName name={thatTable?.name} which="that" />
                      record using a column named:
                    </div>
                    <TextInput bind:value={mappingToThatColumnName} />
                  </LabeledInput>
                </FormField>
              {/if}
            {:else if relationshipType === 'one-to-many'}
              <FormField errors={handleColumnErrors(thatNewColumnName, 'that')}>
                <LabeledInput layout="stacked">
                  <div slot="label">
                    The
                    <TableName name={thatTable?.name} which="that" />
                    table will get a new column named:
                  </div>
                  <TextInput bind:value={thatNewColumnName} />
                </LabeledInput>
              </FormField>
              <FormField>
                Then each
                <TableName name={thatTable?.name} which="that" />
                record will use that column to reference one
                <TableName name={thisTable?.name} which="this" />
                record.
              </FormField>
            {:else if relationshipType === 'many-to-one'}
              <FormField errors={handleColumnErrors(thisNewColumnName, 'this')}>
                <LabeledInput layout="stacked">
                  <div slot="label">
                    The
                    <TableName name={thisTable?.name} which="this" />
                    table will get a new column named:
                  </div>
                  <TextInput bind:value={thisNewColumnName} />
                </LabeledInput>
              </FormField>
              <FormField>
                Then each
                <TableName name={thisTable?.name} which="this" />
                record will use that column to reference one
                <TableName name={thatTable?.name} which="that" />
                record.
              </FormField>
            {:else if relationshipType === 'one-to-one'}
              <FormField errors={handleColumnErrors(thisNewColumnName, 'this')}>
                <LabeledInput layout="stacked">
                  <div slot="label">
                    The
                    <TableName name={thisTable?.name} which="this" />
                    table will get a new column named:
                  </div>
                  <TextInput bind:value={thisNewColumnName} />
                </LabeledInput>
              </FormField>
              <FormField>
                Then each
                <TableName name={thisTable?.name} which="this" />
                record will use that column to reference one
                <TableName name={thatTable?.name} which="that" />
                record.
              </FormField>
              <FormField>
                The
                <TableName name={thisTable?.name} which="this" />
                table will also get a unique constraint ensuring that no two records
                can reference the same
                <TableName name={thatTable?.name} which="that" />
                record.
              </FormField>
            {/if}
          </div>
        </FormField>
      {/if}
    </Form>
  </div>

  <CancelOrProceedButtonPair
    slot="footer"
    onProceed={handleSave}
    onCancel={() => controller.close()}
    proceedButton={{ label: 'Create Link', icon: iconTableLink }}
    canProceed={areFieldsFilled()}
  />
</ControlledModal>

<style>
  .form {
    --this-table-color: #f8c988;
    --that-table-color: #ade5b2;
    --mapping-table-color: #bcb0e7;
    /*
    Increase line-height so that table name backgrounds don't intersect when
    they occur on two adjacent lines due to text wrapping.
    */
    line-height: 1.5;
  }
  .form.self-referential {
    --that-table-color: var(--this-table-color);
  }
  .link {
    cursor: pointer;
    text-decoration: underline;
  }
  .relationships {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .diagram-column {
    margin-left: 1em;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .relationship-type-name {
    font-weight: bold;
    color: #666;
    margin-bottom: 0.5em;
    text-align: center;
    width: max-content;
  }
  .diagram {
    --size: 6em;
    width: var(--size);
    height: var(--size);
  }
  .under-the-hood {
    padding: 0.5em 0 0.5em 1em;
    border-left: solid 0.25em #ddd;
  }
  .title {
    margin-bottom: 0.75em;
  }
</style>
