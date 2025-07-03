<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import { iconExpandRight } from '@mathesar/icons';
  import { Icon } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: EditableDataFormManager;

  $: ({ selectedElement } = dataFormManager);
</script>

<div class="data-form-inspector">
  <div class="inspector-navigation">
    {#if $selectedElement?.type === 'field'}
      <div>
        {#if $selectedElement.field.parentField}
          <div></div>
        {:else}
          <div>{$_('form')}</div>
        {/if}
        <Icon {...iconExpandRight} />
        {#if $selectedElement.field.kind === 'reverse_foreign_key'}
          <div></div>
        {:else}
          <div></div>
        {/if}
      </div>
    {:else}
      <div>
        {$_('form')}
      </div>
    {/if}
  </div>
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

<style lang="scss">
  .inspector-navigation {
    border-bottom: 1px solid var(--border-color);
  }
</style>
