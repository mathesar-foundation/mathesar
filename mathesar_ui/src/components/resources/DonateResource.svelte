<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ResourceCard from '@mathesar/components/resources/ResourceCard.svelte';
  import { iconDonation } from '@mathesar/icons';
  import { getMarketingLink } from '@mathesar/routes/urls';
</script>

<ResourceCard
  icon={iconDonation}
  href={getMarketingLink('donate')}
  --icon-fill-color="var(--color-brand)"
  --icon-bg-color="var(--color-brand-10)"
>
  <span slot="title">{$_('support_our_mission')}</span>
  <span slot="description">{$_('donate_blurb')}</span>
</ResourceCard>
