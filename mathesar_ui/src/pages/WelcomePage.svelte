<script lang="ts">
  import { _ } from 'svelte-i18n';
  import {
    Tutorial,
    Icon,
    Button,
    AnchorButton,
  } from '@mathesar-component-library';
  import { iconConnection, iconAddNew } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { getDocsLink } from '@mathesar/routes/urls';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;
</script>

<LayoutWithHeader
  cssVariables={{
    '--page-padding': '0',
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
        {$_('database_connections')}
      </div>
      <div class="content" data-identifier="connection-empty-text">
        <Tutorial>
          <div slot="body">
            <div data-identifier="connection-icon">
              <Icon {...iconConnection} size="var(--size-super-ultra-large)" />
            </div>
            <div data-identifier="no-connections-text">
              {$_('no_database_connections_yet')}
            </div>
            <div data-identifier="no-connections-help">
              {$_('setup_connections_help')}
            </div>
          </div>
          <Button slot="footer" appearance="primary">
            <Icon {...iconAddNew} />
            <span>{$_('add_database_connection')}</span>
          </Button>
        </Tutorial>
      </div>
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
              {$_('start_working_with_mathesar')}
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
              href={getDocsLink('/')}
              target="_blank"
            >
              {$_('join_community_chat')}
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

    [data-identifier='connection-empty-text'] {
      text-align: center;

      [data-identifier='connection-icon'] {
        color: var(--sand-800);
      }
      [data-identifier='no-connections-text'] {
        font-size: var(--size-large);
        font-weight: 500;
        margin-top: var(--size-base);
      }
      [data-identifier='no-connections-help'] {
        margin-top: var(--size-super-ultra-small);
      }
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

        > .header {
          font-weight: 500;
        }
        > .content {
          margin-top: var(--size-x-small);
        }
        > .footer {
          margin-top: var(--size-x-large);
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
