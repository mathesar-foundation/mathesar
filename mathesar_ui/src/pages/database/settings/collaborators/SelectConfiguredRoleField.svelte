<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RequiredField } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import type { ConfiguredRole } from '@mathesar/models/ConfiguredRole';
  import { type ImmutableMap, Select } from '@mathesar-component-library';

  const SelectConfiguredRole = Select<ConfiguredRole['id']>;

  export let configuredRoleId: RequiredField<number | undefined>;
  export let configuredRolesMap: ImmutableMap<number, ConfiguredRole>;
</script>

<Field
  label={$_('role')}
  layout="stacked"
  field={configuredRoleId}
  input={{
    component: SelectConfiguredRole,
    props: {
      options: [...configuredRolesMap.values()].map((r) => r.id),
      getLabel: (option) => {
        if (option) {
          return configuredRolesMap.get(option)?.name ?? String(option);
        }
        return $_('select_role');
      },
      autoSelect: 'none',
    },
  }}
  help={$_('collaborator_role_help')}
/>
