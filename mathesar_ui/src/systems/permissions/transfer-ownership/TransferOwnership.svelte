<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { FormSubmit, makeForm } from '@mathesar/components/form';
  import {
    type ModalController,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import type { PermissionsStoreValues } from '../permissionsUtils';

  type Privilege = $$Generic;

  export let controller: ModalController;
  export let storeValues: PermissionsStoreValues<Privilege>;
  $: ({ roles, permissionsMetaData } = storeValues);

  const form = makeForm({});

  function transferOwnership() {}
</script>

<div use:portalToWindowFooter class="footer">
  <div></div>
  <FormSubmit
    {form}
    canProceed={$form.hasChanges}
    catchErrors
    onCancel={() => {
      controller.close();
    }}
    onProceed={transferOwnership}
    proceedButton={{ label: $_('transfer_ownership') }}
    cancelButton={{ label: $_('cancel') }}
  />
</div>
