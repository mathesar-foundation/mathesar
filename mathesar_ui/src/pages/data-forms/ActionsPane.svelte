<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import { iconForms, iconSave, iconShare } from '@mathesar/icons';
  import type { DataForm } from '@mathesar/models/DataForm';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { toast } from '@mathesar/stores/toast';
  import { Button, Icon, SpinnerButton } from '@mathesar-component-library';

  import type { DataFormManager } from '../../systems/data-forms/data-form-utilities/DataFormManager';

  export let dataForm: DataForm;
  export let dataFormManager: DataFormManager;
  $: ({ name } = dataFormManager.ephemeralDataForm);

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
    <SpinnerButton
      onClick={saveForm}
      icon={{ ...iconSave, size: '0.8em' }}
      label={$_('save')}
      tooltip={$_('save_form')}
    />
  </svelte:fragment>
</EntityPageHeader>
