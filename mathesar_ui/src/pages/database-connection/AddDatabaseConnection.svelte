<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import {
    DATABASE_CONNECTION_ADD_URL,
    getDatabasePageUrl,
  } from '@mathesar/routes/urls';
  import { toast } from '@mathesar/stores/toast';
  import type { SuccessfullyConnectedDatabase } from '@mathesar/AppTypes';
  import { router } from 'tinro';
  import { reloadDatabases } from '@mathesar/stores/databases';
  import { reflectApi } from '@mathesar/api/reflect';
  import FormBox from '../admin-users/FormBox.svelte';
  import DatabaseConnectionForm from './DatabaseConnectionForm.svelte';

  async function handleSuccess(
    event: CustomEvent<SuccessfullyConnectedDatabase>,
  ) {
    const database = event.detail;
    toast.success(`${database.name} connected successfully!`);
    await reflectApi.reflect();
    await reloadDatabases();
    router.goto(getDatabasePageUrl(database.name));
  }
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: DATABASE_CONNECTION_ADD_URL,
    label: 'Add Database Connection',
    icon: iconAddNew,
  }}
/>

<h1>Add Database Connection</h1>

<FormBox>
  <DatabaseConnectionForm on:create={handleSuccess} />
</FormBox>
