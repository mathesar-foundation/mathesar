<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { Icon } from '@mathesar/component-library';
  import DatabaseConnectionForm from './DatabaseConnectionForm.svelte';
  import { iconDatabase } from '@mathesar/icons';
  import FormBox from '../admin-users/FormBox.svelte';
  import {
    ADD_DATABASE_CONNECTION_URL,
    getDatabasePageUrl,
  } from '@mathesar/routes/urls';
  import { toast } from '@mathesar/stores/toast';
  import type { Database } from '@mathesar/AppTypes';
  import { router } from 'tinro';

  function handleSuccess(event: CustomEvent<Database>) {
    const database = event.detail;
    toast.success(`${database.name} connected successfully!`);
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
