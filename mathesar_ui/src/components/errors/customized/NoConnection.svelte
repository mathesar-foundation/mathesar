<script lang="ts">
  import { _ } from 'svelte-i18n';

  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
</script>

<p>{$_('not_a_collaborator_help')}</p>
<p><SeeDocsToLearnMore page="collaborators" /></p>
