<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import SaveButton from '@mathesar/components/SaveButton.svelte';
  import { iconForms, iconShare } from '@mathesar/icons';
  import type { DataForm } from '@mathesar/models/DataForm';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { toast } from '@mathesar/stores/toast';
  import type { EditableDataFormManager } from '@mathesar/systems/data-forms';
  import { Dropdown, Icon } from '@mathesar-component-library';

  import ShareForm from './ShareForm.svelte';

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
    <SaveButton onSave={saveForm} canSave={$hasChanges} />
    <Dropdown
      showArrow={false}
      triggerAppearance="secondary"
      ariaLabel={$_('share')}
    >
      <svelte:fragment slot="trigger">
        <Icon {...iconShare} />
        <span class="responsive-button-label"> {$_('share')} </span>
      </svelte:fragment>
      <svelte:fragment slot="content">
        <ShareForm {dataForm} {dataFormManager} />
      </svelte:fragment>
    </Dropdown>
  </svelte:fragment>
</EntityPageHeader>
