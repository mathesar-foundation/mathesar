<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconExpandRight } from '@mathesar/icons';
  import { Button, Icon, iconShowMore } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import { EphemeralDataForm } from '../data-form-utilities/EphemeralDataForm';
  import type { EphemeralDataFormField } from '../data-form-utilities/types';

  import FieldNavigationElement from './FieldNavigationElement.svelte';

  export let dataFormManager: EditableDataFormManager;
  export let field: EphemeralDataFormField | undefined = undefined;

  $: parent = field?.holder.parent;
  $: parentField = parent instanceof EphemeralDataForm ? undefined : parent;
  $: parentOfParentField = parentField?.holder.parent;
  $: parentFieldOfParentField =
    parentOfParentField instanceof EphemeralDataForm
      ? undefined
      : parentOfParentField;

  function selectHiddenParent() {
    if (parentFieldOfParentField) {
      dataFormManager.selectElement({
        type: 'field',
        field: parentFieldOfParentField,
      });
    } else {
      dataFormManager.resetSelectedElement();
    }
  }
</script>

<div class="form-nav">
  {#if field}
    {#if parentOfParentField}
      <Button appearance="ghost" on:click={selectHiddenParent}>
        <Icon {...iconShowMore} />
      </Button>
      <div class="icon-holder">
        <Icon {...iconExpandRight} />
      </div>
    {/if}

    <FieldNavigationElement {dataFormManager} field={parentField} />
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
