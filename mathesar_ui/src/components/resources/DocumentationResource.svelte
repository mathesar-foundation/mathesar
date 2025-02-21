<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ResourceCard from '@mathesar/components/resources/ResourceCard.svelte';
  import { iconDocumentation } from '@mathesar/icons';
  import { getDocsLink } from '@mathesar/routes/urls';
</script>

<ResourceCard icon={iconDocumentation} href={getDocsLink('userGuide')}>
  <span slot="title">{$_('documentation')}</span>
  <span slot="description">{$_('user_guide_description')}</span>
</ResourceCard>
