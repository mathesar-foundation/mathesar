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
  import { LL } from '@mathesar/i18n/i18n-svelte';

  const userProfileStore = getUserProfileStoreFromContext();

  $: userProfile = $userProfileStore;
</script>

<svelte:head>
  <title
    >{userProfile?.getDisplayName() ?? $LL.general.userProfile()} | Mathesar</title
  >
</svelte:head>

<LayoutWithHeader
  cssVariables={{
    '--page-padding': 'var(--outer-page-padding-for-inset-page)',
    '--layout-background-color': 'var(--sand-200)',
    '--inset-page-section-padding':
      'var(--size-ultra-large) var(--size-xx-large)',
  }}
>
  <InsetPageLayout hasMultipleSections>
    <h1 slot="header">{$LL.general.userProfile()}</h1>
    {#if userProfile}
      <InsetPageSection>
        <h2 class="large-bold-header" slot="header">
          {$LL.general.accountDetails()}
        </h2>
        <UserDetailsForm user={userProfile.getUser()} />
      </InsetPageSection>
      <InsetPageSection>
        <PasswordChangeForm userId={userProfile.id} />
      </InsetPageSection>

      {#if !userProfile.isSuperUser}
        <InsetPageSection>
          <h2 class="large-bold-header" slot="header">
            {$LL.general.deleteAccount()}
          </h2>
          <div>
            {$LL.profilePage.contactAdminForPermanentDeletion()}
          </div>
        </InsetPageSection>
      {/if}
    {:else}
      <!-- This should never happen -->
      <ErrorBox>
        {$LL.profilePage.couldNoFetchProfile()}
      </ErrorBox>
    {/if}
  </InsetPageLayout>
</LayoutWithHeader>

<style>
  h2 {
    margin: 0 0 1em 0;
  }
</style>
