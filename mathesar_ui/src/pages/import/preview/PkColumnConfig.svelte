<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type { Column } from '@mathesar/api/rpc/columns';
  import CollapsibleFieldset from '@mathesar/components/CollapsibleFieldset.svelte';
  import {
    FieldLayout,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import SelectColumn from '@mathesar/components/SelectColumn.svelte';
  import { iconUndo } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import { getDbTypesForAbstractType } from '@mathesar/stores/abstract-types/abstractTypeCategories';
  import { matchLiteral } from '@mathesar/utils/patternMatching';
  import {
    LabeledInput,
    Select,
    assertExhaustive,
  } from '@mathesar-component-library';

  const strategies = ['add', 'pick'] as const;
  type Strategy = (typeof strategies)[number];

  const columnTypes = ['integer', 'uuid'] as const;
  type ColumnType = (typeof columnTypes)[number];

  const defaultOptions = ['identity', 'uuid4', 'none'] as const;
  type DefaultValue = (typeof defaultOptions)[number];

  /** The DB types that can potentially support an identity default. */
  const identityCapableDbTypes = getDbTypesForAbstractType('number');

  export let table: Table;
  export let columns: Column[];
  export let onUpdated: () => Promise<void>;

  let isOpen = false;

  /** The PK column that Mathesar auto-added to the import. */
  $: autoAddedColumn = columns.find(
    (c) => c.id === table.metadata?.mathesar_added_pkey_attnum,
  );
  /**
   * If the table's primary key was auto-added by Mathesar, the we initialize
   * the form to indicate an "add" strategy. Otherwise, "pick".
   */
  $: initialStrategy = autoAddedColumn ? ('add' as const) : ('pick' as const);
  $: availableColumns = columns.filter((c) => c.id !== autoAddedColumn?.id);
  $: initialTypeOfColumnToAdd = ((): ColumnType => {
    if (initialStrategy === 'pick') return 'integer';
    if (autoAddedColumn) {
      if (autoAddedColumn.type === 'integer') return 'integer';
      if (autoAddedColumn.type === 'uuid') return 'uuid';
    }
    return 'integer';
  })();

  $: strategy = requiredField<Strategy>(initialStrategy);
  $: typeOfColumnToAdd = requiredField<ColumnType>(initialTypeOfColumnToAdd);
  $: pickedColumn = requiredField<Column>(availableColumns[0]);
  $: defaultValueOptions = ((): DefaultValue[] => {
    if ($strategy === 'add') {
      if ($typeOfColumnToAdd === 'integer') return ['identity'];
      if ($typeOfColumnToAdd === 'uuid') return ['uuid4'];
      return assertExhaustive($typeOfColumnToAdd);
    }
    if ($strategy === 'pick') {
      if (identityCapableDbTypes.has($pickedColumn.type)) {
        return ['identity', 'none'];
      }
      if ($pickedColumn.type === 'uuid') return ['uuid4', 'none'];
      return ['none'];
    }
    return assertExhaustive($strategy);
  })();
  $: defaultValue = requiredField<DefaultValue>(defaultValueOptions[0]);
  $: form = makeForm({
    strategy,
    defaultValue,
    ...matchLiteral($strategy, {
      add: { typeOfColumnToAdd },
      pick: { pickedColumn },
    }),
  });
  $: strategyHasChanges = strategy.hasChanges;

  async function addPkColumn(p: { dropExistingPkColumn: boolean }) {
    await api.columns
      .add_primary_key_column({
        database_id: table.schema.database.id,
        table_oid: table.oid,
        pkey_type: matchLiteral($typeOfColumnToAdd, {
          integer: 'IDENTITY',
          uuid: 'UUIDv4',
        } as const),
        drop_existing_pkey_column: p.dropExistingPkColumn,
      })
      .run();
  }

  function changePkColumn(p: { dropExistingPkColumn: boolean }) {
    return api.data_modeling
      .change_primary_key_column({
        database_id: table.schema.database.id,
        table_oid: table.oid,
        column_attnum: $pickedColumn.id,
        default: matchLiteral($defaultValue, {
          identity: 'IDENTITY',
          uuid4: 'UUIDv4',
          none: null,
        } as const),
        drop_existing_pk_column: p.dropExistingPkColumn,
      })
      .run();
  }

  async function update() {
    if ($strategyHasChanges) {
      if ($strategy === 'pick') {
        // Strategy changed from "add" to "pick".
        await changePkColumn({ dropExistingPkColumn: true });
      } else if ($strategy === 'add') {
        // Strategy changed from "pick" to "add".
        await addPkColumn({ dropExistingPkColumn: false });
      } else {
        assertExhaustive($strategy);
      }
    }

    if ($strategy === 'add') {
      // $typeOfColumnToAdd must have changed
      await addPkColumn({ dropExistingPkColumn: true });
    } else if ($strategy === 'pick') {
      // $pickedColumn or $defaultValue must have changed
      await changePkColumn({ dropExistingPkColumn: false });
    } else {
      assertExhaustive($strategy);
    }

    isOpen = false;

    await onUpdated();
  }
</script>

<CollapsibleFieldset bind:isOpen>
  <span slot="label">{$_('primary_key_column')}</span>
  <FieldLayout>
    <LabeledInput label={$_('strategy')}>
      <Select bind:value={$strategy} options={strategies} let:option>
        {#if option === 'add'}{$_('add_a_new_pk_column')}
        {:else if option === 'pick'}{$_('choose_existing_pk_column')}
        {:else}{assertExhaustive(option)}
        {/if}
      </Select>
    </LabeledInput>
  </FieldLayout>
  <FieldLayout>
    {#if $strategy === 'add'}
      <LabeledInput label={$_('column_type')}>
        <Select
          bind:value={$typeOfColumnToAdd}
          options={columnTypes}
          let:option
        >
          {#if option === 'integer'}{$_('Integer')}
          {:else if option === 'uuid'}{$_('UUID')}
          {:else}{assertExhaustive(option)}
          {/if}
        </Select>
      </LabeledInput>
    {:else if $strategy === 'pick'}
      <LabeledInput label={$_('column')}>
        <SelectColumn bind:value={$pickedColumn} columns={availableColumns} />
      </LabeledInput>
    {:else}
      {assertExhaustive($strategy)}
    {/if}
  </FieldLayout>
  <FieldLayout>
    <LabeledInput label={$_('default_value')}>
      <Select
        bind:value={$defaultValue}
        options={defaultValueOptions}
        let:option
      >
        {#if option === 'identity'}{$_('auto_incrementing_identity')}
        {:else if option === 'uuid4'}{$_('random_uuidv4')}
        {:else if option === 'none'}{$_('no_default')}
        {:else}{assertExhaustive(option)}
        {/if}
      </Select>
    </LabeledInput>
    {#if $defaultValue === 'none'}
      <div class="error">
        <WarningBox>
          <p>{$_('heads_up')}</p>
          <p>{$_('pk_no_default_warning_0')}</p>
          <ul>
            <li>{$_('pk_no_default_warning_1')}</li>
            <li>{$_('pk_no_default_warning_2')}</li>
          </ul>
          <p>{$_('pk_no_default_warning_3')}</p>
        </WarningBox>
      </div>
    {/if}
  </FieldLayout>

  {#if $form.hasChanges}
    <FieldLayout>
      <FormSubmit
        {form}
        onProceed={update}
        catchErrors
        proceedButton={{ label: $_('update_primary_key_column') }}
        cancelButton={{ label: $_('discard_changes'), icon: iconUndo }}
      />
    </FieldLayout>
  {/if}
</CollapsibleFieldset>

<style>
  .error {
    margin: 0.5rem 0 0 1rem;
  }
</style>
