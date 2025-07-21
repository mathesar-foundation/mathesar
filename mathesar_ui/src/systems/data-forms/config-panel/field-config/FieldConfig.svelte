<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
</script>

<InspectorTabContent>
  <InspectorSection title={$_('field_text')}></InspectorSection>
  <InspectorSection title={$_('field_source')}></InspectorSection>
  <InspectorSection title={$_('field_validation')}></InspectorSection>
  <InspectorSection title={$_('field_appearance')}></InspectorSection>
  <InspectorSection title={$_('field_fk_rule')}></InspectorSection>
  <InspectorSection title={$_('field_fk_record_summary')}></InspectorSection>
</InspectorTabContent>
