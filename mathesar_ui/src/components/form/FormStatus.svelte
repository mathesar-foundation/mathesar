<script lang="ts">
  import ModificationStatus from '../ModificationStatus.svelte';

  import type { Form } from './form';

  export let form: Form;

  $: ({ requestStatus } = form);
  $: ({ hasChanges } = $form);
</script>

<ModificationStatus {hasChanges} requestState={$requestStatus?.state} />
