<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import { iconExploration, iconShare } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import type { DataFormManager } from './DataFormManager';

  export let dataFormManager: DataFormManager;
  $: ({ ephemeralDataForm } = dataFormManager);
</script>

<div class="actions-pane">
  <EntityPageHeader
    title={{
      name: $ephemeralDataForm.name ?? $_('forms'),
      icon: iconExploration,
    }}
  >
    <svelte:fragment slot="actions-right">
      <Button appearance="secondary">
        <Icon {...iconShare} size="0.8rem" />
        <span>{$_('share')}</span>
      </Button>
    </svelte:fragment>
  </EntityPageHeader>
</div>

<style lang="scss">
</style>
