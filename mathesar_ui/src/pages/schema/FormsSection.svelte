<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import { iconAddNew, iconForm, iconRefresh } from '@mathesar/icons';
  import type { DataForm } from '@mathesar/models/DataForm';
  import { modal } from '@mathesar/stores/modal';
  import { Button, Icon, SpinnerButton } from '@mathesar-component-library';

  import AddEditDataFormModal from './AddEditDataFormModal.svelte';
  import EmptyEntityList from './EmptyEntityList.svelte';
  import ExplorationSkeleton from './ExplorationSkeleton.svelte';
  import FormItem from './FormItem.svelte';

  const dataFormAddEditModal = modal.spawnModalController();
  const schemaRouteContext = SchemaRouteContext.get();

  $: ({ dataForms } = $schemaRouteContext);

  let selectedDataForm: DataForm | undefined = undefined;
</script>

<section>
  <header>
    <h2>{$_('forms')}</h2>
    <div>
      <Button appearance="primary" on:click={() => dataFormAddEditModal.open()}>
        <Icon {...iconAddNew} />
        <span>{$_('new_form')}</span>
      </Button>
    </div>
  </header>
  {#if $dataForms.isLoading}
    <!-- TODO: Use a common skeleton -->
    <ExplorationSkeleton />
  {:else if $dataForms.error}
    <ErrorBox>
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
    </ErrorBox>
  {:else if $dataForms.resolvedValue}
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
        <EmptyEntityList icon={iconForm} text={$_('no_forms')} />
      {/each}
    </div>
  {/if}
</section>

<AddEditDataFormModal
  dataForm={selectedDataForm}
  controller={dataFormAddEditModal}
/>

<style lang="scss">
  header {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--lg1);

    h2 {
      margin: 0;
    }

    & > :global(:last-child) {
      flex-grow: 1;
      text-align: right;
    }
  }
</style>
