<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconExpandRight } from '@mathesar/icons';
  import { Button, Icon, iconShowMore } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../data-form-utilities/AbstractEphemeralField';
  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';

  import FieldNavigationElement from './FieldNavigationElement.svelte';

  export let dataFormManager: EditableDataFormManager;
  export let field: EphemeralDataFormField | undefined = undefined;

  function selectHiddenParent() {
    if (field?.parentField?.parentField) {
      dataFormManager.selectElement({
        type: 'field',
        field: field.parentField.parentField,
      });
    } else {
      dataFormManager.resetSelectedElement();
    }
  }
</script>

<div class="form-nav">
  {#if field}
    {#if field.parentField}
      <Button appearance="ghost" on:click={selectHiddenParent}>
        <Icon {...iconShowMore} />
      </Button>
      <div class="icon-holder">
        <Icon {...iconExpandRight} />
      </div>
    {/if}

    <FieldNavigationElement
      {dataFormManager}
      field={field.parentField ?? undefined}
    />
    <div class="icon-holder">
      <Icon {...iconExpandRight} />
    </div>
  {/if}

  <FieldNavigationElement {dataFormManager} {field} />
</div>

<style lang="scss">
  .form-nav {
    border-bottom: 1px solid var(--border-color);
    padding: var(--sm6);
    display: flex;
    flex-direction: row;
    align-items: center;

    .icon-holder {
      font-size: var(--sm2);
    }
  }
</style>
