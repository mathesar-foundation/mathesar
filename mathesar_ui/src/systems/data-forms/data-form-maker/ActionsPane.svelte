<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import { iconForms, iconSave, iconShare } from '@mathesar/icons';
  import { Button, Icon, SpinnerButton } from '@mathesar-component-library';

  import type { DataFormManager } from './DataFormManager';

  export let dataFormManager: DataFormManager;
  $: ({ name } = dataFormManager.ephemeralDataForm);

  async function addForm() {
    await api.forms
      .add({
        form_def: dataFormManager.ephemeralDataForm.toRawEphemeralDataForm(),
      })
      .run();
  }
</script>

<div class="actions-pane">
  <EntityPageHeader
    title={{
      name: $name || $_('untitled'),
      icon: iconForms,
    }}
  >
    <svelte:fragment>
      <Button appearance="secondary">
        <Icon {...iconShare} size="0.8rem" />
        <span>{$_('share')}</span>
      </Button>
      <SpinnerButton
        onClick={addForm}
        icon={{ ...iconSave, size: '0.8em' }}
        label={$_('save')}
        tooltip={$_('save_form')}
      />
    </svelte:fragment>
  </EntityPageHeader>
</div>

<style lang="scss">
</style>
