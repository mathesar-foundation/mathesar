<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import { iconAddNew, iconForm, iconRefresh } from '@mathesar/icons';
  import type { DataForm } from '@mathesar/models/DataForm';
  import { highlightNewItems } from '@mathesar/packages/new-item-highlighter';
  import { modal } from '@mathesar/stores/modal';
  import { AddEditDataFormModal } from '@mathesar/systems/data-forms/add-edit-modal';
  import { Button, Icon, SpinnerButton } from '@mathesar-component-library';

  import EmptyEntityList from './EmptyEntityList.svelte';
  import FormItem from './FormItem.svelte';
  import SchemaOverviewSideSection from './SchemaOverviewSideSection.svelte';

  const dataFormAddEditModal = modal.spawnModalController();
  const schemaRouteContext = SchemaRouteContext.get();

  $: ({ dataForms, dataFormsFetch } = $schemaRouteContext);

  let selectedDataForm: DataForm | undefined = undefined;
</script>

<SchemaOverviewSideSection
  isLoading={$dataFormsFetch.isLoading}
  hasError={!!$dataFormsFetch.error}
>
  <svelte:fragment slot="header">
    {$_('forms')}
  </svelte:fragment>
  <svelte:fragment slot="actions">
    <Button appearance="secondary" on:click={() => dataFormAddEditModal.open()}>
      <Icon {...iconAddNew} />
      <span>{$_('new_form')}</span>
    </Button>
  </svelte:fragment>
  <svelte:fragment slot="errors">
    {#if $dataFormsFetch.error}
      <p>{$dataFormsFetch.error.message}</p>
      <div>
        <SpinnerButton
          onClick={async () => {
            await dataFormsFetch.run();
          }}
          label={$_('retry')}
          icon={iconRefresh}
        />
        <a href="../">
          <Button>
            <span>{$_('go_to_database')}</span>
          </Button>
        </a>
      </div>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="content">
    {#if $dataFormsFetch.resolvedValue}
      <div
        class="forms-list"
        use:highlightNewItems={{
          scrollHint: $_('schema_new_items_scroll_hint'),
        }}
      >
        {#each [...$dataForms.values()] as dataForm (dataForm.id)}
          <FormItem
            {dataForm}
            deleteDataForm={() => $schemaRouteContext.removeDataForm(dataForm)}
            editDataForm={() => {
              selectedDataForm = dataForm;
              dataFormAddEditModal.open();
            }}
          />
        {:else}
          <EmptyEntityList icon={iconForm} text={$_('no_forms')} />
        {/each}
      </div>
    {/if}
  </svelte:fragment>
</SchemaOverviewSideSection>

<AddEditDataFormModal
  controller={dataFormAddEditModal}
  dataForm={selectedDataForm}
  onClose={() => {
    selectedDataForm = undefined;
  }}
/>
