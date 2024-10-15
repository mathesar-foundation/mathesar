<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconExternalHyperlink } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { getDocsLink, getWikiLink } from '@mathesar/routes/urls';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { DatabasesEmptyState } from '@mathesar/systems/databases';
  import { AnchorButton, Icon } from '@mathesar-component-library';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;
</script>

<LayoutWithHeader
  restrictWidth={true}
  cssVariables={{
    '--page-padding': '0',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
  }}
>
  <div data-identifier="welcome-header">
    <span>
      {$_('welcome_to_mathesar_user', {
        values: { user: userProfile?.getDisplayName() },
      })}
    </span>
  </div>

  <div data-identifier="welcome-container">
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
      <div class="content" data-identifier="documentation-links">
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
</LayoutWithHeader>

<style lang="scss">
  [data-identifier='welcome-header'] {
    display: flex;
    padding: var(--size-x-large);
    align-items: center;
    border-bottom: 1px solid var(--sand-200);

    span {
      flex: 1 0 0;
      color: var(--slate-800);
      font-size: var(--size-x-large);
      font-weight: 600;
    }
  }

  [data-identifier='welcome-container'] {
    display: flex;
    padding: var(--size-x-large);
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

    [data-identifier='documentation-links'] {
      display: flex;
      flex-direction: row;
      gap: var(--size-large);

      .document-block {
        flex: 1 1 0px;
        background: var(--sand-100);
        border: 1px solid var(--sand-300);
        border-radius: var(--border-radius-l);
        padding: var(--size-large);
        display: flex;
        flex-direction: column;

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
      [data-identifier='documentation-links'] {
        flex-direction: column;
      }
    }
  }
</style>
