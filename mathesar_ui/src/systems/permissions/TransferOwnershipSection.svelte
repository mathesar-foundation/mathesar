<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { FormSubmit, makeForm } from '@mathesar/components/form';
  import {
    type ModalController,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  export let controller: ModalController;

  const form = makeForm({});

  function transferOwnership() {}
</script>

<div use:portalToWindowFooter class="footer">
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
