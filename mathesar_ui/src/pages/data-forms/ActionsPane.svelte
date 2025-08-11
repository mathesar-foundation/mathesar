<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import SaveButton from '@mathesar/components/SaveButton.svelte';
  import { DataFormRouteContext } from '@mathesar/contexts/DataFormRouteContext';
  import { iconEdit, iconForm, iconShare } from '@mathesar/icons';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { modal } from '@mathesar/stores/modal';
  import { toast } from '@mathesar/stores/toast';
  import { AddEditDataFormModal } from '@mathesar/systems/data-forms/add-edit-modal';
  import type { EditableDataFormManager } from '@mathesar/systems/data-forms/form-maker';
  import { Button, Dropdown, Icon } from '@mathesar-component-library';

  import ShareForm from './ShareForm.svelte';

  const dataFormAddEditModal = modal.spawnModalController();
  const dataFormRouteContext = DataFormRouteContext.get();
  $: ({ dataForm } = $dataFormRouteContext);

  export let dataFormManager: EditableDataFormManager;

  $: ({ hasChanges } = dataFormManager);
  $: ({ name, description } = dataForm);

  async function saveForm() {
    try {
      await $dataFormRouteContext.updateStructure(
        dataFormManager.dataFormStructure.toRawStructure(),
      );
    } catch (err) {
      toast.error(RpcError.fromAnything(err).message);
    }
  }
</script>

<EntityPageHeader
  title={{
    name: $name || $_('untitled'),
    description: $description ?? undefined,
    icon: iconForm,
  }}
>
  <svelte:fragment>
    <Button appearance="plain" on:click={() => dataFormAddEditModal.open()}>
      <Icon {...iconEdit} />
    </Button>
  </svelte:fragment>
  <svelte:fragment slot="actions-right">
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

<AddEditDataFormModal {dataForm} controller={dataFormAddEditModal} />
