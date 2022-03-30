<script lang="ts">
  import {
    faDatabase,
    faPalette,
    faTimesCircle,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    Button,
    FormBuilder,
    Icon,
    getValidationContext,
  } from '@mathesar-component-library';
  import type { FormValues } from '@mathesar-component-library/types';
  import type { DbType } from '@mathesar/App';
  import type { Column } from '@mathesar/stores/table-data/types';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';

  import DatabaseOptions from './database-options/DatabaseOptions.svelte';
  import { constructDbForm, constructDisplayForm } from './utils';

  export let selectedAbstractType: AbstractType;
  export let selectedDbType: DbType;
  export let typeOptions: Column['type_options'];
  export let displayOptions: Column['display_options'];
  export let column: Column;

  let selectedTab: 'database' | 'display' = 'database';
  let dbFormHasError = false;
  let displayFormHasError = false;

  // Why are the following not reactive?
  // The whole component gets re-rendered when selectedAbstractType changes,
  // so these do not have to be reactive.
  // Also, these functions should not be reactive for changes in selectedDbType and column.
  const { dbOptionsConfig, dbForm, dbFormValues } = constructDbForm(
    selectedAbstractType,
    selectedDbType,
    column,
  );
  const { displayOptionsConfig, displayForm, displayFormValues } =
    constructDisplayForm(selectedAbstractType, selectedDbType, column);

  const validationContext = getValidationContext();
  validationContext.addValidator('AbstractTypeConfigValidator', () => {
    let isValid = true;
    if (dbForm) {
      const isDbFormValid = dbForm.getValidationResult().isValid;
      dbFormHasError = !isDbFormValid;
      isValid = isValid && isDbFormValid;
    }
    if (displayForm) {
      const isDisplayFormValid = displayForm.getValidationResult().isValid;
      displayFormHasError = !isDisplayFormValid;
      isValid = isValid && isDisplayFormValid;
    }
    return isValid;
  });

  function onDbFormValuesChange(dbFormValueSubstance: FormValues) {
    if (dbOptionsConfig) {
      const determinedResult = dbOptionsConfig.determineDbTypeAndOptions(
        dbFormValueSubstance,
        column.type,
      );
      typeOptions = determinedResult.typeOptions ?? {};
      selectedDbType = determinedResult.dbType;
      validationContext.validate();
    }
  }

  function onDisplayFormValuesChange(displayFormValueSubstance: FormValues) {
    if (displayOptionsConfig) {
      displayOptions =
        displayOptionsConfig?.determineDisplayOptions(
          displayFormValueSubstance,
        ) ?? {};
      validationContext.validate();
    }
  }

  $: onDbFormValuesChange($dbFormValues);
  $: onDisplayFormValuesChange($displayFormValues);
</script>

<div class="type-options">
  <!-- TODO: Make tab container more low-level to be used here -->
  <!-- Ensure tab accessibility in the low-level component -->
  <ul class="type-option-tabs">
    <li
      class="type-option-tab"
      class:selected={selectedTab === 'database'}
      class:has-error={dbFormHasError}
    >
      <Button
        appearance="ghost"
        class="padding-zero"
        on:click={() => {
          selectedTab = 'database';
        }}
      >
        <Icon size="0.75em" data={faDatabase} />
        <span>Database</span>
        {#if dbFormHasError}
          <Icon class="error-icon" data={faTimesCircle} />
        {/if}
      </Button>
    </li>
    {#if displayForm}
      <li
        class="type-option-tab"
        class:selected={selectedTab === 'display'}
        class:has-error={displayFormHasError}
      >
        <Button
          appearance="ghost"
          class="padding-zero"
          on:click={() => {
            selectedTab = 'display';
          }}
        >
          <Icon size="0.75em" data={faPalette} />
          <span>Display</span>
          {#if displayFormHasError}
            <Icon class="error-icon" data={faTimesCircle} />
          {/if}
        </Button>
      </li>
    {/if}
  </ul>
  <div class="type-options-content">
    {#if selectedTab === 'database'}
      <DatabaseOptions bind:selectedDbType {selectedAbstractType} {dbForm} />
    {:else if displayForm}
      <FormBuilder form={displayForm} />
    {/if}
  </div>
</div>
