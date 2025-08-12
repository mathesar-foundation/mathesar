<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import SaveButton from '@mathesar/components/SaveButton.svelte';
  import { DataFormRouteContext } from '@mathesar/contexts/DataFormRouteContext';
  import { iconForm, iconShare } from '@mathesar/icons';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { toast } from '@mathesar/stores/toast';
  import type { EditableDataFormManager } from '@mathesar/systems/data-forms/form-maker';
  import { Dropdown, Icon } from '@mathesar-component-library';

  import ShareForm from './ShareForm.svelte';

  const dataFormRouteContext = DataFormRouteContext.get();
  $: ({ dataForm } = $dataFormRouteContext);

  export let dataFormManager: EditableDataFormManager;

  $: ({ hasChanges } = dataFormManager);
  $: ({ structure } = dataForm);

  async function saveForm() {
    try {
      await dataForm.updateStructure(
        dataFormManager.dataFormStructure.toRawStructure(),
      );
    } catch (err) {
      toast.error(RpcError.fromAnything(err).message);
    }
  }
</script>

<EntityPageHeader
  title={{
    name: $structure.name || $_('untitled'),
    description: $structure.description ?? undefined,
    icon: iconForm,
  }}
>
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
