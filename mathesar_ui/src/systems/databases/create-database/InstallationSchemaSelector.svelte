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
    bike_shop: 'Bike Shop',
    hardware_store: 'Hardware Store',
    ice_cream_employees: 'Ice  Cream Employee Management',
    library_makerspace: 'Library Makerspace',
    library_management: 'Library Management',
    museum_exhibits: 'Museum Exhibits',
    nonprofit_grants: 'Nonprofit Grant Tracking',
  };
  const installationSchemaHelp: Record<InstallationSchema, string> = {
    internal: $_('internal_schema_help'),
    bike_shop: $_('sample_data_bike_shop_help'),
    hardware_store: $_('sample_data_hardware_store_help'),
    ice_cream_employees: $_('sample_data_ice_cream_employees_help'),
    library_makerspace: $_('sample_data_library_makerspace_help'),
    library_management: $_('sample_data_library_help'),
    museum_exhibits: $_('sample_data_museum_exhibits_help'),
    nonprofit_grants: $_('sample_data_nonprofit_grants_help'),
  };

  export let installationSchemas: RequiredField<InstallationSchema[]>;
</script>

<div>
  <CheckboxGroup
    boxed
    label={$_('schemas_to_install')}
    ariaLabel={$_('schemas_to_install')}
    bind:values={$installationSchemas}
    options={installationSchemaOptions}
    getCheckboxLabel={(o) => installationSchemaLabels[o]}
    getCheckboxHelp={(o) => installationSchemaHelp[o]}
    getCheckboxDisabled={(o) => o === 'internal'}
  />
</div>
