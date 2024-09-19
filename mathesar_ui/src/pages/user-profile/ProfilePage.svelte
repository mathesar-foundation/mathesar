<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InsetPageSection from '@mathesar/components/InsetPageSection.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { PasswordChangeForm, UserDetailsForm } from '@mathesar/systems/users';

  const userProfileStore = getUserProfileStoreFromContext();

  $: userProfile = $userProfileStore;
</script>

<svelte:head>
  <title>
    {userProfile?.getDisplayName() ?? $_('user_profile')} | {$_('mathesar')}
  </title>
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
    <h1 slot="header">{$_('user_profile')}</h1>
    {#if userProfile}
      <InsetPageSection>
        <h2 class="large-bold-header" slot="header">
          {$_('account_details')}
        </h2>
        <UserDetailsForm user={userProfile.getUser()} />
      </InsetPageSection>
      <InsetPageSection>
        <PasswordChangeForm userId={userProfile.id} />
      </InsetPageSection>

      {#if !userProfile.isSuperUser}
        <InsetPageSection>
          <h2 class="large-bold-header" slot="header">
            {$_('delete_account')}
          </h2>
          <div>
            {$_('delete_account_contact_admin')}
          </div>
        </InsetPageSection>
      {/if}
    {:else}
      <!-- This should never happen -->
      <ErrorBox>
        {$_('could_not_fetch_profile_error')}
      </ErrorBox>
    {/if}
  </InsetPageLayout>
</LayoutWithHeader>

<style>
  h2 {
    margin: 0 0 1em 0;
  }
</style>
