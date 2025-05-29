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
  import UiThemeSelect from './UiThemeSelect.svelte';

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
          triggerAppearance="secondary"
          triggerClass="padding-compact"
          size="small"
          closeOnInnerClick={false}
          menuStyle="--Menu__padding-x: 0.3em;"
        >
          <div class="user-switcher" slot="trigger">
            <Icon
              {...iconSettingsMajor}
              hasNotificationDot={upgradable}
              size="1.2rem"
            />
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

          <MenuDivider />
          <MenuHeading>{$_('theme')}</MenuHeading>
          <div class="theme-switcher">
            <UiThemeSelect />
          </div>
          <MenuDivider />

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
    padding: 0 0.5rem;
    height: var(--header-height);
    background: var(--header-background);
    border-bottom: 1px solid var(--header-border);
    box-shadow: var(--shadow-color) 0 1px 3px 0;
    overflow: hidden;
    color: var(--text-color);
    font-size: 1rem;
  }

  .left {
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .right {
    display: flex;
    align-items: center;
    gap: var(--sm2);
  }

  .theme-switcher {
    padding: 0.5rem;
    margin-top: -0.5rem;
  }

  .user-switcher {
    color: var(--text-color);
    border-radius: var(--border-radius-m);
    display: flex;
    align-items: center;
  }
</style>
