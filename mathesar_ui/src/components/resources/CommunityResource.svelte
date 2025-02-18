<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ResourceCard from '@mathesar/components/resources/ResourceCard.svelte';
  import { iconCommunityChat } from '@mathesar/icons';
  import { getMarketingLink } from '@mathesar/routes/urls';
</script>

<ResourceCard icon={iconCommunityChat} href={getMarketingLink('community')}>
  <span slot="title">{$_('chat_with_community')}</span>
  <span slot="description">{$_('connect_with_community_help')}</span>
</ResourceCard>
