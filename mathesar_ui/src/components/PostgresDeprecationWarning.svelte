<script lang="ts">
  import { _ } from 'svelte-i18n';

  import DocsLink from '@mathesar/components/DocsLink.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';

  export let deprecatedDatabaseNames: string[] = [];

  $: hasDeprecated = deprecatedDatabaseNames.length > 0;
  $: databaseList = deprecatedDatabaseNames.join(', ');
</script>

{#if hasDeprecated}
  <WarningBox fullWidth>
    <RichText
      text={$_('postgres_deprecation_warning')}
      let:slotName
      let:translatedArg
    >
      {#if slotName === 'bold'}
        <b>{translatedArg}</b>
      {/if}
      {#if slotName === 'databaseList'}
        <b>{databaseList}</b>
      {/if}
      {#if slotName === 'versionSupportLink'}
        <DocsLink page="versionSupport">
          {translatedArg}
        </DocsLink>
      {/if}
    </RichText>
  </WarningBox>
{/if}
