<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    iconCommunityChat,
    iconDatabase,
    iconDocumentation,
    iconDonation,
    iconLogout,
    iconSettingsMajor,
    iconUser,
  } from '@mathesar/icons';
  import {
    ADMIN_URL,
    LOGOUT_URL,
    USER_PROFILE_URL,
    getDatabasePageUrl,
    getDocsLink,
    getMarketingLink,
  } from '@mathesar/routes/urls';
  import { databasesStore } from '@mathesar/stores/databases';
  import { getReleaseDataStoreFromContext } from '@mathesar/stores/releases';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import Feedback from '@mathesar/systems/feedback/Feedback.svelte';
  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import {
    DropdownMenu,
    Icon,
    LinkMenuItem,
    MenuDivider,
    MenuHeading,
  } from '@mathesar-component-library';

  import Breadcrumb from './breadcrumb/Breadcrumb.svelte';
  import { getBreadcrumbItemsFromContext } from './breadcrumb/breadcrumbUtils';

  const commonData = preloadCommonData();
  const userProfile = getUserProfileStoreFromContext();
  const releaseDataStore = getReleaseDataStoreFromContext();
  const breadcrumbItems = getBreadcrumbItemsFromContext();
  const { currentDatabase } = databasesStore;

  function getCompactLayoutThreshold(breadcrumbItemCount: number): number {
    switch (breadcrumbItemCount) {
      case 0:
        return 350;
      case 1:
        return 500;
      case 2:
        return 700;
      case 3:
        return 800;
      default:
        return 900;
    }
  }

  let width = 0;

  $: database = $currentDatabase;
  $: upgradable = $releaseDataStore?.value?.upgradeStatus === 'upgradable';
  $: isNormalRoutingContext = commonData.routing_context === 'normal';
  $: compactLayout = width < getCompactLayoutThreshold($breadcrumbItems.length);
</script>

<header class="app-header" bind:clientWidth={width}>
  <div class="left">
    <Breadcrumb items={$breadcrumbItems} {compactLayout} />
  </div>

  {#if isNormalRoutingContext}
    <div class="right">
      <Feedback {compactLayout} />

      {#if $userProfile}
        <DropdownMenu
          triggerAppearance="ghost"
          size="small"
          closeOnInnerClick={true}
          menuStyle="--Menu__padding-x: 0.3em;"
        >
          <div class="user-switcher" slot="trigger">
            <Icon {...iconSettingsMajor} hasNotificationDot={upgradable} />
          </div>
          {#if database}
            <MenuHeading>{$_('database')}</MenuHeading>
            <LinkMenuItem
              icon={iconDatabase}
              href={getDatabasePageUrl(database.id)}
            >
              {database.displayName}
            </LinkMenuItem>
            <MenuDivider />
          {/if}
          <MenuHeading>{$_('signed_in_as')}</MenuHeading>
          <LinkMenuItem icon={iconUser} href={USER_PROFILE_URL}>
            {$userProfile.getDisplayName()}
          </LinkMenuItem>

          <MenuDivider />

          {#if $userProfile.isMathesarAdmin}
            <LinkMenuItem
              icon={iconSettingsMajor}
              href={ADMIN_URL}
              hasNotificationDot={upgradable}
            >
              {$_('administration')}
            </LinkMenuItem>
            <MenuDivider />
          {/if}

          <MenuHeading>{$_('resources')}</MenuHeading>
          <LinkMenuItem
            icon={iconDocumentation}
            href={getDocsLink('userGuide')}
            tinro-ignore
            target="_blank"
          >
            {$_('user_guide')}
          </LinkMenuItem>
          <LinkMenuItem
            icon={iconCommunityChat}
            href={getMarketingLink('community')}
            tinro-ignore
            target="_blank"
          >
            {$_('community')}
          </LinkMenuItem>
          <LinkMenuItem
            icon={iconDonation}
            href={getMarketingLink('donate')}
            tinro-ignore
            target="_blank"
          >
            {$_('donate_to_mathesar')}
          </LinkMenuItem>

          <MenuDivider />

          <LinkMenuItem icon={iconLogout} href={LOGOUT_URL} tinro-ignore>
            {$_('log_out')}
          </LinkMenuItem>
        </DropdownMenu>
      {/if}
    </div>
  {/if}
</header>

<style lang="scss">
  .app-header {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 1rem;
    height: var(--header-height, 60px);
    background-color: var(--white);
    overflow: hidden;
    color: var(--stormy-900);
  }

  .left {
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .right {
    display: flex;
    align-items: center;
    font-size: var(--text-size-large);
    gap: var(--size-x-small);
  }

  .user-switcher {
    background-color: var(--slate-200);
    color: var(--slate-800);
    border-radius: var(--border-radius-m);
    padding: 0.5rem;
    display: flex;
    align-items: center;
  }
</style>
