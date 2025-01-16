<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    iconCommunityChat,
    iconDocumentation,
    iconDonation,
  } from '@mathesar/icons';
  import { getDocsLink, getMarketingLink } from '@mathesar/routes/urls';

  import ResourceCard from './ResourceCard.svelte';
</script>

<div class="resources">
  <h2>{$_('resources')}</h2>
  <div class="cards">
    <ResourceCard icon={iconDocumentation} href={getDocsLink('userGuide')}>
      <span slot="title">{$_('documentation')}</span>
      <span slot="description">{$_('user_guide_description')}</span>
      <span slot="link-text">{$_('open_user_guide')}</span>
    </ResourceCard>

    <ResourceCard icon={iconCommunityChat} href={getMarketingLink('community')}>
      <span slot="title">{$_('chat_with_community')}</span>
      <span slot="description">{$_('connect_with_community_help')}</span>
      <span slot="link-text">{$_('join_chat')}</span>
    </ResourceCard>

    <ResourceCard icon={iconDonation} href={getMarketingLink('donate')}>
      <span slot="title">{$_('support_our_mission')}</span>
      <span slot="description">{$_('donate_blurb')}</span>
      <span slot="link-text">{$_('donate_to_mathesar')}</span>
    </ResourceCard>
  </div>
</div>

<style lang="scss">
  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .cards > :global(*) {
    flex: 1 0 15rem;
  }
</style>
