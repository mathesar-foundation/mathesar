<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconSettingsMajor, iconSettingsMinor } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import PageLayoutWithSidebar from '@mathesar/layouts/PageLayoutWithSidebar.svelte';
  import SettingsPage from '@mathesar/pages/admin-settings/SettingsPage.svelte';
  import SoftwareUpdate from '@mathesar/pages/admin-update/SoftwareUpdatePage.svelte';
  import AdminNavigation from '@mathesar/pages/admin-users/AdminNavigation.svelte';

  import {
    ADMIN_SETTINGS_PAGE_URL,
    ADMIN_UPDATE_PAGE_URL,
    ADMIN_URL,
  } from './urls';
  import UsersRoute from './UsersRoute.svelte';
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: ADMIN_URL,
    label: $_('administration'),
    icon: iconSettingsMajor,
  }}
/>

<Route path="/" redirect={ADMIN_UPDATE_PAGE_URL} />

<LayoutWithHeader
  cssVariables={{
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
    '--page-padding': '0 var(--page-padding-x)',
  }}
  restrictWidth
>
  <AppSecondaryHeader
    slot="secondary-header"
    name={$_('administration')}
    icon={iconSettingsMajor}
  />
  <PageLayoutWithSidebar>
    <AdminNavigation slot="sidebar" />

    <Route path="/update">
      <AppendBreadcrumb
        item={{
          type: 'simple',
          href: ADMIN_UPDATE_PAGE_URL,
          label: $_('software_update'),
          prependSeparator: true,
        }}
      />
      <SoftwareUpdate />
    </Route>

    <Route path="/users/*" firstmatch>
      <UsersRoute />
    </Route>

    <Route path="/settings" firstmatch>
      <AppendBreadcrumb
        item={{
          type: 'simple',
          href: ADMIN_SETTINGS_PAGE_URL,
          label: $_('settings'),
          icon: iconSettingsMinor,
          prependSeparator: true,
        }}
      />
      <SettingsPage />
    </Route>
  </PageLayoutWithSidebar>
</LayoutWithHeader>
