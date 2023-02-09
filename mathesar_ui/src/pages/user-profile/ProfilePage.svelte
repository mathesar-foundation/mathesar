<script lang="ts">
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import InsetPageSection from '@mathesar/components/InsetPageSection.svelte';
  import {
    UserDetailsForm,
    PasswordChangeForm,
  } from '@mathesar/systems/users-and-permissions';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';

  const userProfileStore = getUserProfileStoreFromContext();

  $: userProfile = $userProfileStore;
</script>

<svelte:head>
  <title>{userProfile?.getDisplayName() ?? 'User profile'} | Mathesar</title>
</svelte:head>

<LayoutWithHeader
  cssVariables={{
    '--layout-background-color': 'var(--sand-200)',
    '--inset-layout-padding': 'var(--size-xx-large) 0',
    '--inset-page-section-padding':
      'var(--size-ultra-large) var(--size-xx-large)',
  }}
>
  <InsetPageLayout hasMultipleSections>
    <h1 slot="header">User Profile</h1>
    {#if userProfile}
      <InsetPageSection>
        <h2 slot="header">Account Details</h2>
        <UserDetailsForm user={userProfile} />
      </InsetPageSection>
      <InsetPageSection>
        <PasswordChangeForm userId={userProfile.id} />
      </InsetPageSection>

      {#if !userProfile.is_superuser}
        <InsetPageSection>
          <h2 slot="header">Delete Account</h2>
          <div>
            Please contact your administrator to request permanent deletion of
            your account
          </div>
        </InsetPageSection>
      {/if}
    {:else}
      <!-- This should never happen -->
      <ErrorBox>
        Could not fetch user profile details. Try refreshing your page.
      </ErrorBox>
    {/if}
  </InsetPageLayout>
</LayoutWithHeader>

<style>
  h2 {
    font-weight: 500;
    font-size: var(--size-large);
    margin: 0 0 1em 0;
  }
</style>
