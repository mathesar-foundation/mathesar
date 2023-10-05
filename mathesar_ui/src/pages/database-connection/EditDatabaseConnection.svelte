<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconDeleteMajor, iconEdit } from '@mathesar/icons';
  import { toast } from '@mathesar/stores/toast';
  import {
    getDatabaseConnectionEditUrl,
    getDatabasePageUrl,
  } from '@mathesar/routes/urls';
  import { databases, reloadDatabases } from '@mathesar/stores/databases';
  import { reflectApi } from '@mathesar/api/reflect';
  import { router } from 'tinro';
  import { modal } from '@mathesar/stores/modal';
  import Button from '@mathesar/component-library/button/Button.svelte';
  import { Icon } from '@mathesar/component-library';
  import FormBox from '../admin-users/FormBox.svelte';
  import DatabaseConnectionForm from './DatabaseConnectionForm.svelte';
  import DeleteDatabaseConnectionConfirmationModal from '../database/DeleteDatabaseConnectionConfirmationModal.svelte';

  export let databaseName: string;

  const deleteConnectionModal = modal.spawnModalController();

  $: database = $databases.data.find((db) => db.name === databaseName);

  async function handleSuccess() {
    toast.success(`${databaseName} updated successfully!`);

    try {
      await reflectApi.reflect();
      await reloadDatabases();
    } catch (e) {
      toast.fromError(e);
    } finally {
      router.goto(getDatabasePageUrl(databaseName));
    }
  }

  async function handleSuccessfulDeleteConnection() {
    await reloadDatabases();
    router.goto('/');
  }
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: getDatabaseConnectionEditUrl(databaseName),
    label: 'Edit Database Connection',
    icon: iconEdit,
  }}
/>

<h1>Edit Database Connection</h1>

<FormBox>
  <DatabaseConnectionForm {databaseName} onUpdate={handleSuccess} />
</FormBox>

{#if database}
  <FormBox>
    <Button
      on:click={() => deleteConnectionModal.open()}
      danger
      appearance="default"
    >
      <Icon {...iconDeleteMajor} />
      <span>Disconnect Database</span>
    </Button>
  </FormBox>
  <DeleteDatabaseConnectionConfirmationModal
    controller={deleteConnectionModal}
    {database}
    on:success={handleSuccessfulDeleteConnection}
  />
{/if}
