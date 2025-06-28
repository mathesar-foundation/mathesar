<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { replaceExploration } from '@mathesar/stores/queries';
  import type { ModalController } from '@mathesar-component-library';

  /**
   * TODO: Implement this function so that users get client-side name validation
   * when renaming explorations. We might want to fix [4418][4418] first though.
   *
   * [4418]: https://github.com/mathesar-foundation/mathesar/issues/4418
   */
  const getNameValidationErrors = () => [];

  export let exploration: SavedExploration;
  export let controller: ModalController;

  async function handleSave(name: string, description: string) {
    await replaceExploration({ ...exploration, name, description });
  }
</script>

<NameAndDescInputModalForm
  {controller}
  save={handleSave}
  {getNameValidationErrors}
  getInitialName={() => exploration.name}
  getInitialDescription={() => exploration.description ?? ''}
>
  <span slot="title" let:initialName>
    <RichText text={$_('edit_exploration_with_name')} let:slotName>
      {#if slotName === 'explorationName'}
        <Identifier>{initialName}</Identifier>
      {/if}
    </RichText>
  </span>
</NameAndDescInputModalForm>
