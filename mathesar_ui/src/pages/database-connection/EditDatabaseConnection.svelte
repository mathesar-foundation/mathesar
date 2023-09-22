<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { Icon } from '@mathesar/component-library';
  import DatabaseConnectionForm from './DatabaseConnectionForm.svelte';
  import { iconDatabase, iconEdit } from '@mathesar/icons';
  import FormBox from '../admin-users/FormBox.svelte';
  import { toast } from '@mathesar/stores/toast';
  import { getDatabaseConnectionEditUrl } from '@mathesar/routes/urls';
  import { reloadDatabases } from '@mathesar/stores/databases';
  import { reflectApi } from '@mathesar/api/reflect';

  export let databaseName: string;

  async function handleSuccess() {
    toast.success(`${databaseName} updated successfully!`);
    await reflectApi.reflect();
    await reloadDatabases();
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

<h1><Icon {...iconDatabase} /> Edit Database Connection</h1>

<FormBox>
  <DatabaseConnectionForm {databaseName} on:update={handleSuccess} />
</FormBox>
