<script lang="ts">
  import { Route } from 'tinro';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconSettingsMajor } from '@mathesar-component-library';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { ADMIN_URL, ADMIN_GENERAL_PAGE_URL, ADMIN_USERS_PAGE_URL } from './urls';
  import UsersRoute from './UsersRoute.svelte';
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: ADMIN_URL,
    label: 'Administration',
    icon: iconSettingsMajor,
  }}
/>

<Route path="/" redirect={ADMIN_GENERAL_PAGE_URL} />

<LayoutWithHeader>
  <h1>Administration route</h1>
  <div>
    <a href={ADMIN_GENERAL_PAGE_URL}>Goto general</a>
    <a href={ADMIN_USERS_PAGE_URL}>Goto users</a>
  </div>

  <Route path="/general">
    <h2>General</h2>
  </Route>

  <Route path="/users/*" firstmatch>
    <h2>Users</h2>
    <UsersRoute/>
  </Route>
</LayoutWithHeader>
