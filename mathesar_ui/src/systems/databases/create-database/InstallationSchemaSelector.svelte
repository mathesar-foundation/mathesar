<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    type SampleDataSchemaIdentifier,
    sampleDataOptions,
  } from '@mathesar/api/rpc/databases';
  import type { RequiredField } from '@mathesar/components/form/field';
  import { CheckboxGroup } from '@mathesar-component-library';

  type InstallationSchema = SampleDataSchemaIdentifier | 'internal';
  const installationSchemaOptions: InstallationSchema[] = [
    'internal',
    ...sampleDataOptions,
  ];
  const installationSchemaLabels: Record<InstallationSchema, string> = {
    // These strings are not translated because these are the names that will
    // appear in the Mathesar UI after installation.
    internal: 'mathesar_types, __msar, msar',
    library_management: 'Library Management',
    movie_collection: 'Movie Collection',
  };
  const installationSchemaHelp: Record<InstallationSchema, string> = {
    internal: $_('internal_schema_help'),
    library_management: $_('sample_data_library_help'),
    movie_collection: $_('sample_data_movies_help'),
  };

  export let installationSchemas: RequiredField<InstallationSchema[]>;
</script>

<div class="schemas-cbgroup">
  <CheckboxGroup
    label={$_('schemas_to_install')}
    ariaLabel={$_('schemas_to_install')}
    bind:values={$installationSchemas}
    options={installationSchemaOptions}
    getCheckboxLabel={(o) => installationSchemaLabels[o]}
    getCheckboxHelp={(o) => installationSchemaHelp[o]}
    getCheckboxDisabled={(o) => o === 'internal'}
  />
</div>

<style>
  .schemas-cbgroup :global(ul.options) {
    background: var(--white);
    padding: 1rem;
    border: 1px solid var(--slate-200);
    border-radius: var(--border-radius-m);
    margin-top: var(--size-ultra-small);
  }
</style>
