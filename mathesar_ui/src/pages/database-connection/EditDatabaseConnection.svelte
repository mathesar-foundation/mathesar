<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconEdit } from '@mathesar/icons';
  import { toast } from '@mathesar/stores/toast';
  import {
    getDatabaseConnectionEditUrl,
    getDatabasePageUrl,
  } from '@mathesar/routes/urls';
  import { reloadDatabases } from '@mathesar/stores/databases';
  import { reflectApi } from '@mathesar/api/reflect';
  import { router } from 'tinro';
  import FormBox from '../admin-users/FormBox.svelte';
  import DatabaseConnectionForm from './DatabaseConnectionForm.svelte';

  export let databaseName: string;

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
