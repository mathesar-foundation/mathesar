<script lang="ts">
  import { Route } from 'tinro';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconSettingsMajor } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { ADMIN_URL, ADMIN_GENERAL_PAGE_URL } from './urls';
  import UsersRoute from './UsersRoute.svelte';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import AdminPageLayout from '@mathesar/pages/admin-users/AdminPageLayout.svelte';
  import AdminNavigation from '@mathesar/pages/admin-users/AdminNavigation.svelte';

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
      name: 'Administrator',
      icon: iconSettingsMajor,
    }}
  />
  <AdminPageLayout cssVariables={{ '--max-layout-width': PAGE_MAX_WIDTH }}>
    <AdminNavigation slot="sidebar" />
    <Route path="/general">
      <h2>General</h2>
    </Route>

    <Route path="/users/*" firstmatch>
      <UsersRoute />
    </Route>
  </AdminPageLayout>
</LayoutWithHeader>
