<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconExternalHyperlink } from '@mathesar/icons';
  import { getDocsLink, getWikiLink } from '@mathesar/routes/urls';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { DatabasesEmptyState } from '@mathesar/systems/databases';
  import { AnchorButton, Icon } from '@mathesar-component-library';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;
</script>

<div class="welcome-header">
  <span>
    {$_('welcome_to_mathesar_user', {
      values: { user: userProfile?.getDisplayName() },
    })}
  </span>
</div>

<div class="welcome-container">
  <section>
    <div class="header">
      {$_('databases')}
    </div>
    <DatabasesEmptyState />
  </section>
  <hr />
  <section>
    <div class="header">
      {$_('documentation_and_resources')}
    </div>
    <div class="content documentation-links">
      <div class="document-block">
        <div class="header">{$_('getting_started')}</div>
        <div class="content">
          {$_('getting_started_help')}
        </div>
        <div class="footer">
          <AnchorButton
            appearance="secondary"
            href={getDocsLink('/')}
            target="_blank"
          >
            <span>{$_('start_working_with_mathesar')}</span>
            <Icon {...iconExternalHyperlink} />
          </AnchorButton>
        </div>
      </div>
      <div class="document-block">
        <div class="header">{$_('feel_stuck_or_feedback')}</div>
        <div class="content">
          {$_('connect_with_community_help')}
        </div>
        <div class="footer">
          <AnchorButton
            appearance="secondary"
            href={getWikiLink('/community/')}
            target="_blank"
          >
            <span>{$_('join_community_chat')}</span>
            <Icon {...iconExternalHyperlink} />
          </AnchorButton>
        </div>
      </div>
    </div>
  </section>
</div>

<style lang="scss">
  .welcome-header {
    display: flex;
    padding: var(--size-xx-large);
    align-items: center;
    border-bottom: 1px solid var(--sand-200);

    span {
      flex: 1 0 0;
      color: var(--slate-800);
      font-size: var(--size-xx-large);
      font-weight: 600;
    }
  }

  .welcome-container {
    display: flex;
    padding: var(--size-xx-large);
    flex-direction: column;
    gap: var(--size-x-small);
    align-items: stretch;

    section {
      display: flex;
      gap: var(--size-large);
      flex-direction: column;

      > .header {
        font-size: var(--size-large);
        font-weight: 500;
      }
    }

    hr {
      margin: var(--size-large) 0;
    }

    .documentation-links {
      display: flex;
      flex-direction: row;
      gap: var(--size-large);

      .document-block {
        flex: 1 1 0px;
        border: 1px solid var(--sand-300);
        border-radius: var(--border-radius-l);
        padding: var(--size-large);
        display: flex;
        flex-direction: column;
        background: var(--white);

        > .header {
          font-weight: 500;
        }
        > .content {
          margin-top: var(--size-x-small);
        }
        > .footer {
          padding-top: var(--size-x-large);
          margin-top: auto;
        }
      }
    }

    @media screen and (max-width: 50rem) {
      .documentation-links {
        flex-direction: column;
      }
    }
  }
</style>
