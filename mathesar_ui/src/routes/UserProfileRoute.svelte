<script lang="ts">
  import { _ } from 'svelte-i18n';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconUser } from '@mathesar/icons';
  import ProfilePage from '@mathesar/pages/user-profile/ProfilePage.svelte';
  import { USER_PROFILE_URL } from './urls';
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: USER_PROFILE_URL,
    label: $_('user_profile'),
    icon: iconUser,
  }}
/>

<ProfilePage />
