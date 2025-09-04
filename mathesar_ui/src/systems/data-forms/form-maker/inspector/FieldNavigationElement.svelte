<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import {
    Button,
    ensureReadable,
    iconError,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../data-form-utilities/fields';

  export let dataFormManager: EditableDataFormManager;
  export let field: DataFormField | undefined = undefined;

  $: ({ selectedElement } = dataFormManager);
  $: label = field ? field.label : ensureReadable(null);
  $: fieldDisplayLabel = $label ?? $_('field');
  $: selected = (() => {
    if ($selectedElement?.type === 'field') {
      return $selectedElement.field === field;
    }
    return !field;
  })();

  function selectField() {
    if (field) {
      dataFormManager.selectElement({ type: 'field', field });
    }
  }
</script>

{#if field}
  <Button appearance="ghost" on:click={selectField} style="overflow:hidden;">
    <div class="nav-element" class:selected>
      {#if 'fieldColumn' in field}
        <ColumnName
          column={{
            ...field.fieldColumn.column,
            constraintsType: field.fieldColumn.foreignKeyLink
              ? ['foreignkey']
              : [],
          }}
        />
      {:else if 'error' in field}
        <div class="error">
          <NameWithIcon name={fieldDisplayLabel} icon={iconError} />
        </div>
      {:else}
        <span>{fieldDisplayLabel}</span>
      {/if}
    </div>
  </Button>
{:else}
  <Button
    appearance="ghost"
    on:click={() => dataFormManager.resetSelectedElement()}
  >
    <div class="nav-element" class:selected>
      {$_('form')}
    </div>
  </Button>
{/if}

<style lang="scss">
  .nav-element {
    padding: var(--sm6);
    overflow: hidden;

    &.selected {
      font-weight: var(--font-weight-bold);
    }

    &:not(.selected):hover {
      text-decoration: underline;
    }

    .error {
      color: var(--semantic-danger-text);
    }
  }
</style>
