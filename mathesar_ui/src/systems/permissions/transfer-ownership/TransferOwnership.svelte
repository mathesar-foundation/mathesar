<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import type { Role } from '@mathesar/models/Role';
  import {
    type ModalController,
    Select,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import type { PermissionsStoreValues } from '../permissionsUtils';

  type Privilege = $$Generic;

  export let controller: ModalController;
  export let transferOwnership: (o: Role['oid']) => Promise<void>;

  export let storeValues: PermissionsStoreValues<Privilege>;
  $: ({ roles, permissionsMetaData, currentRole } = storeValues);

  $: roleOids = [...roles.values()].map((r) => r.oid);
  $: ownerOid = permissionsMetaData.ownerOid;
  $: currentRoleInfo = roles.get(currentRole.currentRoleOid);

  /**
   * The current role might directly or indirectly own the object.
   * In the list of possible new owners, display:
   * - The current role, if it's not the direct owner.
   * - The list of roles inheried by current role (direct or indirect),
   *   omitting the direct owner.
   *
   * If the current role is a db superuser, then display all roles expect
   * the direct owner.
   */
  $: possibleNewOwners = currentRoleInfo?.super
    ? roleOids
    : [...currentRole.parentRoleOids.values(), currentRole.currentRoleOid];
  $: possibleNewOwnersWithoutCurrentOwner = new Set(
    possibleNewOwners.filter((oid) => oid !== $ownerOid),
  );

  const SelectRole = Select<Role['oid']>;
  const newOwner = requiredField<number | undefined>(undefined);
  const form = makeForm({ newOwner });

  async function transfer() {
    if ($newOwner) {
      await transferOwnership($newOwner);
    }
    controller.close();
  }
</script>

<div>
  <Field
    label={$_('new_owner')}
    layout="stacked"
    field={newOwner}
    input={{
      component: SelectRole,
      props: {
        options: roleOids,
        getLabel: (option) => {
          if (option) {
            return roles.get(option)?.name ?? String(option);
          }
          return $_('select_role');
        },
        autoSelect: 'none',
        isOptionDisabled: (option) =>
          option !== undefined &&
          !possibleNewOwnersWithoutCurrentOwner.has(option),
      },
    }}
  />
</div>
<div use:portalToWindowFooter class="footer">
  <FormSubmit
    {form}
    canProceed={$form.hasChanges}
    catchErrors
    onCancel={() => {
      controller.close();
    }}
    onProceed={transfer}
    proceedButton={{ label: $_('transfer_ownership') }}
    cancelButton={{ label: $_('cancel') }}
  />
</div>
