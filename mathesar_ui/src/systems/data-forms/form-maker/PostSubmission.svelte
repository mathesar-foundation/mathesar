<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { RichText } from '@mathesar/components/rich-text';
  import { Button } from '@mathesar-component-library';

  import type { DataFormFillOutManager } from './data-form-utilities/DataFormManager';

  export let dataFormManager: DataFormFillOutManager;

  $: ({ submitMessage, submitRedirectUrl } = dataFormManager.dataFormStructure);
  $: message =
    $submitMessage?.text.trim() ?? $_('thank_you_for_submitting_form');
  $: redirectUrl = (() => {
    let url = $submitRedirectUrl?.trim();
    if (!url) {
      return null;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    return url;
  })();

  onMount(() => {
    const timeOutId = setTimeout(() => {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }, 3000);
    return () => clearTimeout(timeOutId);
  });
</script>

<div class="post-submit">
  <div class="message">
    {message}
  </div>

  <div class="actions">
    {#if redirectUrl}
      <div>
        <RichText text={$_('you_will_be_redirected_to_link')} let:slotName>
          {#if slotName === 'redirectUrl'}
            <a href={redirectUrl}>{redirectUrl}</a>
          {/if}
        </RichText>
      </div>
      <div class="link-help">
        {$_('click_on_link_if_not_redirected')}
      </div>
    {:else}
      <Button on:click={() => dataFormManager.submitAnother()}>
        {$_('submit_another_response')}
      </Button>
    {/if}
  </div>
</div>

<style lang="scss">
  .post-submit {
    text-align: center;
    margin: var(--lg5) 0;

    .message {
      font-size: var(--lg2);
      font-weight: 500;
      overflow-wrap: break-word;
    }

    .actions {
      margin-top: var(--lg2);

      .link-help {
        font-size: var(--sm1);
        margin-top: var(--sm3);
      }
    }
  }
</style>
