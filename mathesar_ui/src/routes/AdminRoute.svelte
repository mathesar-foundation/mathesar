<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconSettingsMajor } from '@mathesar-component-library';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { ADMIN_URL } from './urls';
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: ADMIN_URL,
    label: 'Administration',
    icon: iconSettingsMajor,
  }}
/>

<LayoutWithHeader>Admin page & subroutes</LayoutWithHeader>
