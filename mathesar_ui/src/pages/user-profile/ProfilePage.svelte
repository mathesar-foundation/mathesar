<script lang="ts">
  import { TextInput } from '@mathesar-component-library';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import InsetPageSection from '@mathesar/components/InsetPageSection.svelte';
  import UserDetailsForm from '@mathesar/components/user-detail-controls/UserDetailsForm.svelte';
  import { requiredField, Field } from '@mathesar/components/form';

  export let userDetails;
  const password = requiredField('');
</script>

<svelte:head>
  <title>username | Mathesar</title>
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
    <InsetPageSection>
      <h2 slot="header">Account Details</h2>
      <UserDetailsForm />
    </InsetPageSection>
    <InsetPageSection>
      <h2 slot="header">Credentials</h2>
      <div>
        <Field
          field={password}
          input={{ component: TextInput }}
          label="Password"
        />
      </div>
    </InsetPageSection>
    <!-- Do not show below for super user -->
    <InsetPageSection>
      <h2 slot="header">Delete Account</h2>
      <div>
        Please contact your administrator to request permanent deletion of your
        account
      </div>
    </InsetPageSection>
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
