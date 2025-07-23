<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import SaveButton from '@mathesar/components/SaveButton.svelte';
  import { iconForms, iconShare } from '@mathesar/icons';
  import type { DataForm } from '@mathesar/models/DataForm';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { toast } from '@mathesar/stores/toast';
  import type { EditableDataFormManager } from '@mathesar/systems/data-forms';
  import { Button, Icon } from '@mathesar-component-library';

  export let dataForm: DataForm;
  export let dataFormManager: EditableDataFormManager;
  $: ({ ephemeralDataForm, hasChanges } = dataFormManager);
  $: ({ name } = ephemeralDataForm);

  async function saveForm() {
    try {
      await dataForm.replaceDataForm(
        dataFormManager.ephemeralDataForm.toRawEphemeralDataForm(),
      );
    } catch (err) {
      toast.error(RpcError.fromAnything(err).message);
    }
  }
</script>

<EntityPageHeader
  title={{
    name: $name || $_('untitled'),
    icon: iconForms,
  }}
>
  <svelte:fragment>
    <Button appearance="secondary">
      <Icon {...iconShare} size="0.8rem" />
      <span>{$_('share')}</span>
    </Button>
    <SaveButton onSave={saveForm} canSave={$hasChanges} />
  </svelte:fragment>
</EntityPageHeader>
