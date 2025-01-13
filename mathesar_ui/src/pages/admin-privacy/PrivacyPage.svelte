<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import Spinner from '@mathesar/component-library/spinner/Spinner.svelte';
  import { iconExternalHyperlink } from '@mathesar/icons';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Checkbox, Icon, LabeledInput } from '@mathesar-component-library';

  const analyticsStateStore = new AsyncRpcApiStore(api.analytics.get_state);

  let modifyingAnalyticsState = false;
  $: isAnalyticsStateLoading =
    $analyticsStateStore.isLoading || modifyingAnalyticsState;

  onMount(() => analyticsStateStore.run());

  async function setAnalyticsState(enable: boolean) {
    if (modifyingAnalyticsState) {
      return;
    }

    modifyingAnalyticsState = true;
    try {
      if (enable) {
        await api.analytics.initialize().run();
        toast.success($_('analytics_enabled_successfully'));
      } else {
        await api.analytics.disable().run();
        toast.success($_('analytics_disabled_successfully'));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    modifyingAnalyticsState = false;

    void analyticsStateStore.run();
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('privacy'))}</title>
</svelte:head>

<h1>{$_('privacy')}</h1>

<div>
  <h2>{$_('usage_statistics')}</h2>
  <div>
    <LabeledInput layout="inline-input-first">
      <span slot="label">
        {$_('enable_anonymous_usage_data_collection')}
      </span>
      {#if isAnalyticsStateLoading}
        <Spinner />
      {:else}
        <Checkbox
          checked={$analyticsStateStore.resolvedValue?.enabled}
          on:change={(e) => setAnalyticsState(e.detail)}
        />
      {/if}
      <span tabindex="-1" class="help" slot="help" on:click|stopPropagation>
        <div>{$_('anonymous_usage_data_collection_help')}</div>
        <a href="/" target="_blank" on:click|stopPropagation>
          <span>{$_('see_whats_shared')}</span>
          <Icon {...iconExternalHyperlink} />
        </a>
      </span>
    </LabeledInput>
  </div>
</div>

<style>
  h2 {
    font-size: var(--size-x-large);
    font-weight: var(--font-weight-medium);
  }
</style>
