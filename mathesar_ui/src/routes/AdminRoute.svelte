<script lang="ts">
  import { Route } from 'tinro';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconSettingsMajor } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import AdminPageLayout from '@mathesar/pages/admin-users/AdminPageLayout.svelte';
  import AdminNavigation from '@mathesar/pages/admin-users/AdminNavigation.svelte';
  import UsersRoute from './UsersRoute.svelte';
  import { ADMIN_URL, ADMIN_GENERAL_PAGE_URL } from './urls';

  const PAGE_MAX_WIDTH = '85rem';
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

<LayoutWithHeader cssVariables={{ '--max-layout-width': PAGE_MAX_WIDTH }}>
  <AppSecondaryHeader
    slot="secondary-header"
    theme="light"
    pageTitleAndMetaProps={{
      name: 'Administration',
      icon: iconSettingsMajor,
    }}
  />
  <AdminPageLayout cssVariables={{ '--max-layout-width': PAGE_MAX_WIDTH }}>
    <AdminNavigation slot="sidebar" />
    <Route path="/general">
      <h1>General</h1>
    </Route>

    <Route path="/users/*" firstmatch>
      <UsersRoute />
    </Route>
  </AdminPageLayout>
</LayoutWithHeader>
