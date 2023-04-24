<script lang="ts">
  import { Route } from 'tinro';

  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconSettingsMajor } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import SoftwareUpdate from '@mathesar/pages/admin-update/SoftwareUpdatePage.svelte';
  import AdminNavigation from '@mathesar/pages/admin-users/AdminNavigation.svelte';
  import PageLayoutWithSidebar from '@mathesar/layouts/PageLayoutWithSidebar.svelte';
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

<LayoutWithHeader
  cssVariables={{ '--max-layout-width': PAGE_MAX_WIDTH }}
  restrictWidth
>
  <AppSecondaryHeader
    slot="secondary-header"
    theme="light"
    pageTitleAndMetaProps={{
      name: 'Administration',
      icon: iconSettingsMajor,
    }}
  />
  <PageLayoutWithSidebar>
    <AdminNavigation slot="sidebar" />
    <Route path="/update">
      <AppendBreadcrumb
        item={{
          type: 'simple',
          href: ADMIN_UPDATE_PAGE_URL,
          label: 'Software Update',
        }}
      />
      <SoftwareUpdate />
    </Route>

    <Route path="/users/*" firstmatch>
      <UsersRoute />
    </Route>
  </PageLayoutWithSidebar>
</LayoutWithHeader>
