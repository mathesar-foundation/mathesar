<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { Icon } from '@mathesar/component-library';
  import { iconDatabase } from '@mathesar/icons';
  import {
    ADD_DATABASE_CONNECTION_URL,
    getDatabasePageUrl,
  } from '@mathesar/routes/urls';
  import { toast } from '@mathesar/stores/toast';
  import type { Database } from '@mathesar/AppTypes';
  import { router } from 'tinro';
  import { reloadDatabases } from '@mathesar/stores/databases';
  import { reflectApi } from '@mathesar/api/reflect';
  import FormBox from '../admin-users/FormBox.svelte';
  import DatabaseConnectionForm from './DatabaseConnectionForm.svelte';

  async function handleSuccess(event: CustomEvent<Database>) {
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
    href: ADD_DATABASE_CONNECTION_URL,
    label: 'Add Database Connection',
    icon: iconDatabase,
  }}
/>

<h1><Icon {...iconDatabase} /> Add Database Connection</h1>

<FormBox>
  <DatabaseConnectionForm on:create={handleSuccess} />
</FormBox>
