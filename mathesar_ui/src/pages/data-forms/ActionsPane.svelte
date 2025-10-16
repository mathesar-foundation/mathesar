<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import InspectorButton from '@mathesar/components/InspectorButton.svelte';
  import SaveButton from '@mathesar/components/SaveButton.svelte';
  import { DataFormRouteContext } from '@mathesar/contexts/DataFormRouteContext';
  import { iconForm, iconPubliclyShared, iconShare } from '@mathesar/icons';
  import { trackRecent } from '@mathesar/utils/recentTracker';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { confirm } from '@mathesar/stores/confirmation';
  import { dataFormInspectorVisible } from '@mathesar/stores/localStorage';
  import { toast } from '@mathesar/stores/toast';
  import type { EditableDataFormManager } from '@mathesar/systems/data-forms/form-maker';
  import { Dropdown, Icon } from '@mathesar-component-library';

  import ShareForm from './ShareForm.svelte';

  const dataFormRouteContext = DataFormRouteContext.get();
  $: ({ dataForm } = $dataFormRouteContext);

  export let dataFormManager: EditableDataFormManager;

  $: ({ hasChanges, dataFormStructure } = dataFormManager);
  $: ({ structure, sharePreferences } = dataForm);

  async function saveForm() {
    let confirmationPromise = Promise.resolve(true);

    if (dataFormStructure.hasErrorFields()) {
      confirmationPromise = confirm({
        title: $_('saving_will_remove_fields_with_errors'),
        body: [
          $_('form_contains_fields_with_errors'),
          $_('are_you_sure_to_proceed'),
        ],
        proceedButton: {
          label: $_('save'),
          icon: undefined,
        },
      });
    }
    const isConfirmed = await confirmationPromise;
    if (isConfirmed) {
      try {
        await dataForm.updateStructure(
          dataFormManager.dataFormStructure.toRawStructure({
            withoutErrorFields: true,
          }),
        );
      } catch (err) {
        toast.error(RpcError.fromAnything(err).message);
      }
    }
  }

  function toggleInspector() {
    dataFormInspectorVisible.update((v) => !v);
  }
</script>

<div
  use:trackRecent={{
    entityType: 'form',
    entityId: dataForm.id,
    databaseId: dataForm.schema.database.id,
    schemaOid: dataForm.schema.oid,
    entityName: $structure.name || $_('untitled'),
    entityDescription: $structure.description ?? undefined,
  }}
  style:--icon-fill-color="linear-gradient(135deg, var(--color-data-form), var(--color-data-form-60))"
  style:--icon-stroke-color="var(--color-fg-inverted)"
>
  <EntityPageHeader
    title={{
      name: $structure.name || $_('untitled'),
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
          {#if $sharePreferences.isPublishedPublicly}
            <Icon {...iconPubliclyShared} />
            <span class="responsive-button-label"> {$_('shared_publicly')} </span>
          {:else}
            <Icon {...iconShare} />
            <span class="responsive-button-label"> {$_('share')} </span>
          {/if}
        </svelte:fragment>
        <svelte:fragment slot="content">
          <ShareForm {dataForm} {dataFormManager} />
        </svelte:fragment>
      </Dropdown>
      <InspectorButton
        active={$dataFormInspectorVisible}
        toggle={toggleInspector}
      />
    </svelte:fragment>
  </EntityPageHeader>
</div>
