<script lang="ts">
  import { Route } from 'tinro';

  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconSettingsMajor } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import SoftwareUpdate from '@mathesar/pages/admin-update/SoftwareUpdatePage.svelte';
  import AdminNavigation from '@mathesar/pages/admin-users/AdminNavigation.svelte';
  import AdminPageLayout from '@mathesar/pages/admin-users/AdminPageLayout.svelte';
  import { ADMIN_UPDATE_PAGE_URL, ADMIN_URL } from './urls';
  import UsersRoute from './UsersRoute.svelte';

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

<Route path="/" redirect={ADMIN_UPDATE_PAGE_URL} />

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
    <Route path="/update">
      <SoftwareUpdate />
    </Route>

    <Route path="/users/*" firstmatch>
      <UsersRoute />
    </Route>
  </AdminPageLayout>
</LayoutWithHeader>
