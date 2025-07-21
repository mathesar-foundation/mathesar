<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';

  import FieldNavigation from './FieldNavigation.svelte';

  export let dataFormManager: EditableDataFormManager;

  $: ({ selectedElement } = dataFormManager);
</script>

<div class="data-form-config">
  <div class="nav">
    <FieldNavigation
      field={$selectedElement && 'field' in $selectedElement
        ? $selectedElement.field
        : undefined}
      {dataFormManager}
    />
  </div>
  <div class="content">
    {#if $selectedElement?.type === 'field'}
      <InspectorTabContent>
        <InspectorSection title={$_('field_text')}></InspectorSection>
        <InspectorSection title={$_('field_source')}></InspectorSection>
        <InspectorSection title={$_('field_validation')}></InspectorSection>
        <InspectorSection title={$_('field_appearance')}></InspectorSection>
        <InspectorSection title={$_('field_fk_rule')}></InspectorSection>
        <InspectorSection title={$_('field_fk_record_summary')}
        ></InspectorSection>
      </InspectorTabContent>
    {:else}
      <InspectorTabContent>
        <InspectorSection title={$_('header')}></InspectorSection>
        <InspectorSection title={$_('source')}></InspectorSection>
        <InspectorSection title={$_('associated_role')}></InspectorSection>
        <InspectorSection title={$_('submission_settings')}></InspectorSection>
        <InspectorSection title={$_('sharing_settings')}></InspectorSection>
      </InspectorTabContent>
    {/if}
  </div>
</div>

<style lang="scss">
  .data-form-config {
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;

    .content {
      overflow-x: hidden;
      overflow-y: auto;
    }
  }
</style>
