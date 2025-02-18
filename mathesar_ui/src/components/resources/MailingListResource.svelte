<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ResourceCard from '@mathesar/components/resources/ResourceCard.svelte';
  import { iconMailingList } from '@mathesar/icons';
  import { getMarketingLink } from '@mathesar/routes/urls';
</script>

<ResourceCard icon={iconMailingList} href={getMarketingLink('mailingList')}>
  <span slot="title">{$_('stay_informed')}</span>
  <span slot="description">{$_('join_mailing_list_help')}</span>
</ResourceCard>
