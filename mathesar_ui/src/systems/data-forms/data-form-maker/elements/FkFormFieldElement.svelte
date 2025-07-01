<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import { Select, Spinner } from '@mathesar-component-library';

  import type { DataFormManager } from '../DataFormManager';
  import {
    type EphermeralFkField,
    fkFieldInteractionRules,
  } from '../EphemeralDataForm';

  import DataFormFieldsContainer from './DataFormFieldsContainer.svelte';
  import DataFormInput from './DataFormInput.svelte';
  import DataFormLabel from './DataFormLabel.svelte';

  export let isSelected: boolean;
  export let dataFormManager: DataFormManager;
  export let dataFormField: EphermeralFkField;

  $: ({ rule, linkedTableStructure, nestedFields } = dataFormField);
  $: linkedTableStructureStore = linkedTableStructure.asyncStore;
  $: linkedTable = $linkedTableStructureStore.resolvedValue?.table;

  const interactionRuleText = {
    must_create: {
      short: $_('form_fk_must_create_label'),
      help: $_('form_fk_must_create_help'),
    },
    select_or_create: {
      short: $_('form_fk_select_or_create_label'),
      help: $_('form_fk_select_or_create_help'),
    },
    only_select: {
      short: $_('form_fk_only_select_label'),
      help: $_('form_fk_only_select_help'),
    },
  };
</script>

<div class="fk-field">
  <div class="label-controls-container">
    <DataFormLabel {dataFormField} {isSelected}>
      <Select
        triggerAppearance="outcome"
        options={fkFieldInteractionRules}
        value={$rule}
        on:change={(e) =>
          dataFormField.setInteractionRule(e.detail ?? 'only_select')}
        let:option
      >
        <div>
          <div>
            {option ? interactionRuleText[option].short : ''}
          </div>
          <div class="option-help">
            {option ? interactionRuleText[option].help : ''}
          </div>
        </div>

        <svelte:fragment slot="trigger" let:option={triggerOption}>
          {triggerOption ? interactionRuleText[triggerOption].short : ''}
        </svelte:fragment>
      </Select>
    </DataFormLabel>
  </div>

  {#if $rule !== 'must_create'}
    <div class="fk-input" class:has-margin={$rule !== 'only_select'}>
      <DataFormInput {dataFormField} {isSelected} />
    </div>
  {/if}

  {#if $rule === 'select_or_create'}
    <div class="sub-form-help">
      <RichText text={$_('form_fk_sub_form_help')} let:slotName>
        {#if slotName === 'tableName'}
          <span>
            {#if $linkedTableStructureStore.isLoading}
              <Spinner />
            {:else if linkedTable}
              <TableName table={linkedTable} />
            {/if}
          </span>
        {/if}
      </RichText>
    </div>
  {/if}

  {#if $rule !== 'only_select'}
    <!-- Show spinner when linked table structure hasn't loaded yet -->
    <DataFormFieldsContainer fields={nestedFields} {dataFormManager} />
  {/if}
</div>

<style lang="scss">
  .fk-field {
    display: contents;
    --data-forms__field-padding-left: var(--lg2);

    .label-controls-container {
      margin-bottom: var(--data_forms__label-input-gap);
    }
    .fk-input.has-margin {
      margin-bottom: var(--data_forms__selectable-element-padding);
    }
  }

  .sub-form-help {
    display: block;
    margin-bottom: var(--data_forms__selectable-element-padding);
    color: var(--stormy-600);

    span {
      display: inline-flex;
    }
  }

  .option-help {
    max-width: 25rem;
    white-space: normal;
    font-size: var(--sm1);
  }
</style>
