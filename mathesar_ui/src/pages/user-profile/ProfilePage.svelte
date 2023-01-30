<script lang="ts">
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import InsetPageSection from '@mathesar/components/InsetPageSection.svelte';
  import UserDetailsForm from '@mathesar/components/user-administration-forms/UserDetailsForm.svelte';
  import PasswordChangeForm from '@mathesar/components/user-administration-forms/PasswordChangeForm.svelte';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import type { UnsavedUser } from '@mathesar/api/users';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';

  const userProfileStore = getUserProfileStoreFromContext();

  $: userDetails = $userProfileStore;

  async function updateProfile(request: Omit<UnsavedUser, 'password'>) {
    if (userDetails) {
      await userDetails.update(request);
    }
  }
</script>

<svelte:head>
  <title>{userDetails?.getDisplayName() ?? 'User profile'} | Mathesar</title>
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
    {#if userDetails}
      <InsetPageSection>
        <h2 slot="header">Account Details</h2>
        <UserDetailsForm
          {userDetails}
          saveUserDetails={(details) => updateProfile(details.request)}
        />
      </InsetPageSection>
      <InsetPageSection>
        <PasswordChangeForm userId={userDetails.id} />
      </InsetPageSection>
      <!-- Do not show below for super user -->
      <InsetPageSection>
        <h2 slot="header">Delete Account</h2>
        <div>
          Please contact your administrator to request permanent deletion of
          your account
        </div>
      </InsetPageSection>
    {:else}
      <!-- This should never happen -->
      <ErrorBox>
        Could not fetch user profile details. Try refreshing your page.
      </ErrorBox>
    {/if}
  </InsetPageLayout>
</LayoutWithHeader>

<style>
  h1 {
    font-weight: 500;
    font-size: var(--size-xx-large);
    margin: 0 0 1em 0;
  }
  h2 {
    font-weight: 500;
    font-size: var(--size-large);
    margin: 0 0 1em 0;
  }
</style>
