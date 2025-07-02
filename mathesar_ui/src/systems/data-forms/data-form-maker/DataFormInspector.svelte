<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: EditableDataFormManager;
</script>

<div class="data-form-inspector">
  <InspectorTabContent>
    <InspectorSection title={$_('actions')}></InspectorSection>
  </InspectorTabContent>
</div>
