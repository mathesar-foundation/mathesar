<script lang="ts">
  import { Route } from 'tinro';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconSettingsMajor } from '@mathesar-component-library';
  import MultiPathRoute from '@mathesar/components/routing/MultiPathRoute.svelte';
  import AdminPage from '@mathesar/pages/admin/AdminPage.svelte';
  import { ADMIN_URL, ADMIN_GENERAL_PAGE_URL } from './urls';
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

<MultiPathRoute
  paths={[
    { name: 'general', path: '/general/' },
    { name: 'users', path: '/users/' },
  ]}
  let:path
>
  <AdminPage section={path} />
</MultiPathRoute>
