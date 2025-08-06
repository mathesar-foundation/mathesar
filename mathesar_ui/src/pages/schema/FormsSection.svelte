<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import { iconAddNew, iconForms, iconRefresh } from '@mathesar/icons';
  import type { DataForm } from '@mathesar/models/DataForm';
  import { modal } from '@mathesar/stores/modal';
  import { AddEditDataFormModal } from '@mathesar/systems/data-forms/add-edit-modal';
  import { Button, Icon, SpinnerButton } from '@mathesar-component-library';

  import EmptyEntityList from './EmptyEntityList.svelte';
  import FormItem from './FormItem.svelte';
  import SchemaOverviewSideSection from './SchemaOverviewSideSection.svelte';

  const dataFormAddEditModal = modal.spawnModalController();
  const schemaRouteContext = SchemaRouteContext.get();

  $: ({ dataForms } = $schemaRouteContext);

  let selectedDataForm: DataForm | undefined = undefined;
</script>

<SchemaOverviewSideSection
  isLoading={$dataForms.isLoading}
  hasError={!!$dataForms.error}
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
    {#if $dataForms.error}
      <p>{$dataForms.error.message}</p>
      <div>
        <SpinnerButton
          onClick={async () => {
            await dataForms.run();
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
    {#if $dataForms.resolvedValue}
      <div class="forms-list">
        {#each [...$dataForms.resolvedValue.values()] as dataForm (dataForm.id)}
          <FormItem
            {dataForm}
            deleteDataForm={() => $schemaRouteContext.removeDataForm(dataForm)}
            editDataForm={() => {
              selectedDataForm = dataForm;
              dataFormAddEditModal.open();
            }}
          />
        {:else}
          <EmptyEntityList icon={iconForms} text={$_('no_forms')} />
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
