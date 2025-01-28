<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import type { Database } from '@mathesar/models/Database';
  import { modal } from '@mathesar/stores/modal';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import BulkUpgradeDatabaseForm from './BulkUpgradeDatabaseForm.svelte';
  import type DatabaseUpgradeError from './DatabaseUpgradeError';

  const errorModal = modal.spawnModalController<DatabaseUpgradeError[]>();

  export let formModal: ModalController<Database[]>;
  export { formModal as controller };
  export let refreshDatabaseList: () => Promise<void>;
</script>

<ControlledModal controller={formModal} let:options={databases}>
  <span slot="title">
    {$_('upgrade_multiple_databases')}
  </span>
  <BulkUpgradeDatabaseForm
    {databases}
    {refreshDatabaseList}
    onCancel={() => formModal.close()}
    onFinish={(errors) => {
      formModal.close();
      if (errors.length > 0) {
        errorModal.open(errors);
      }
    }}
  />
</ControlledModal>

<ControlledModal controller={errorModal} let:options={errors}>
  <span slot="title">{$_('some_errors_were_encountered')}</span>
  <p>{$_('the_errors_are_shown_below_for_each_database')}</p>
  <ul>
    {#each errors as error}
      <li>
        <p><b>{error.database.name}</b></p>
        <ErrorBox>
          {error.message}
        </ErrorBox>
      </li>
    {/each}
  </ul>
  <p>{$_('bulk_upgrade_error_troubleshooting_advice')}</p>
</ControlledModal>
