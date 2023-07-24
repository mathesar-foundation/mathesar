<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconUser } from '@mathesar/icons';
  import ProfilePage from '@mathesar/pages/user-profile/ProfilePage.svelte';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import { USER_PROFILE_URL } from './urls';
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: USER_PROFILE_URL,
    label: $LL.general.userProfile(),
    icon: iconUser,
  }}
/>

<ProfilePage />
