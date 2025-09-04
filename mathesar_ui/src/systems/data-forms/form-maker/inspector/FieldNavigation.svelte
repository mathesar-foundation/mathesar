<script lang="ts">
  import { iconExpandRight } from '@mathesar/icons';
  import { Button, Icon, iconShowMore } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import { DataFormStructure } from '../data-form-utilities/DataFormStructure';
  import type { DataFormField } from '../data-form-utilities/fields';

  import FieldNavigationElement from './FieldNavigationElement.svelte';

  export let dataFormManager: EditableDataFormManager;
  export let field: DataFormField | undefined = undefined;

  $: parent = field?.container.parent;
  $: parentField = parent instanceof DataFormStructure ? undefined : parent;
  $: parentOfParentField = parentField?.container.parent;
  $: parentFieldOfParentField =
    parentOfParentField instanceof DataFormStructure
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
  <FieldNavigationElement {dataFormManager} />

  {#if field}
    <div class="icon-holder">
      <Icon {...iconExpandRight} />
    </div>

    {#if parentFieldOfParentField}
      <Button appearance="ghost" on:click={selectHiddenParent}>
        <Icon {...iconShowMore} />
      </Button>
      <div class="icon-holder">
        <Icon {...iconExpandRight} />
      </div>
    {/if}

    {#if parentField}
      <FieldNavigationElement {dataFormManager} field={parentField} />
      <div class="icon-holder">
        <Icon {...iconExpandRight} />
      </div>
    {/if}

    <FieldNavigationElement {dataFormManager} {field} />
  {/if}
</div>

<style lang="scss">
  .form-nav {
    border-bottom: 2px solid var(--border-container);
    display: flex;
    flex-direction: row;
    align-items: center;

    .icon-holder {
      font-size: var(--sm2);
    }
  }
</style>
