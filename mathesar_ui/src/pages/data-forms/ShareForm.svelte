<script lang="ts">
  import { getContext, tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { iconCopyMajor, iconOpenLinkInNewTab } from '@mathesar/icons';
  import type { DataForm } from '@mathesar/models/DataForm';
  import {
    confirm,
    confirmationController,
  } from '@mathesar/stores/confirmation';
  import { toast } from '@mathesar/stores/toast';
  import type { EditableDataFormManager } from '@mathesar/systems/data-forms/form-maker';
  import {
    type AccompanyingElements,
    Button,
    Icon,
    InputGroup,
    SpinnerButton,
    TextInput,
  } from '@mathesar-component-library';

  const dropdownAccompanyingElements = getContext<
    AccompanyingElements | undefined
  >('dropdownAccompanyingElements');

  export let dataForm: DataForm;
  export let dataFormManager: EditableDataFormManager;

  $: ({ sharePreferences, token } = dataForm);
  $: ({ hasChanges } = dataFormManager);
  $: shareLink = `${window.location.origin}/shares/forms/${$token}`;

  let linkInput: HTMLInputElement;

  async function copyLink() {
    if (linkInput && shareLink) {
      linkInput.select();
      try {
        await navigator.clipboard.writeText(shareLink);
      } catch {
        /**
         * The browser does not support navigator.clipboard.writeText
         * (or) restricts permissions to clipboard
         */
        document.execCommand('copy');
      }
      toast.info($_('link_copied'));
    }
  }

  async function shareForm() {
    toast.error('Not implemented yet');
    await dataForm.updateSharingPreferences(true);
  }

  function setConfirmModalToAccompanyDropdown(): () => void {
    const modal = document.querySelector<HTMLElement>(
      `[data-modal-id='${confirmationController.modal.modalId}']`,
    );
    if (!dropdownAccompanyingElements || !modal) {
      return () => {};
    }
    return dropdownAccompanyingElements.add(modal);
  }

  async function regenerateLink() {
    const confirmationPromise = confirm({
      title: $_('remove_old_link_create_new'),
      body: [
        $_('new_link_wont_work_once_regenerated'),
        $_('are_you_sure_to_proceed'),
      ],
      proceedButton: {
        label: $_('regenerate_link'),
        icon: undefined,
      },
    });
    await tick();
    const cleanupDropdown = setConfirmModalToAccompanyDropdown();
    const isConfirmed = await confirmationPromise;
    cleanupDropdown();
    if (isConfirmed) {
      toast.error('Not implemented yet');
      // toast.success($_('link_successfully_regenerated'));
    }
  }

  async function disableLink() {
    const confirmationPromise = confirm({
      title: $_('disable_link_question'),
      body: $_('are_you_sure_to_proceed'),
      proceedButton: {
        label: $_('disable_link'),
        icon: undefined,
      },
    });
    await tick();
    const cleanupDropdown = setConfirmModalToAccompanyDropdown();
    const isConfirmed = await confirmationPromise;
    cleanupDropdown();
    if (isConfirmed) {
      toast.error('Not implemented yet');
      await dataForm.updateSharingPreferences(false);
    }
  }
</script>

<div class="share-container">
  <div class="description">
    {$_('share_form_help')}
  </div>
  <div class="content">
    {#if $hasChanges}
      <WarningBox>
        {$_('form_has_unsaved_changes')}
        {$_('save_form_changes_to_modify_sharing_settings')}
      </WarningBox>
    {/if}

    {#if $sharePreferences.isPublishedPublicly}
      <InputGroup>
        <TextInput bind:element={linkInput} readonly value={shareLink} />
        <Button appearance="secondary" on:click={copyLink}>
          <Icon {...iconCopyMajor} />
        </Button>
        <a class="btn btn-secondary" target="_blank" href={shareLink}>
          <Icon {...iconOpenLinkInNewTab} />
        </a>
      </InputGroup>
      {#if !$hasChanges}
        <div class="share-control-options">
          <SpinnerButton
            appearance="secondary"
            onClick={regenerateLink}
            label={$_('regenerate_link')}
          />
          <SpinnerButton
            appearance="secondary"
            onClick={disableLink}
            label={$_('disable_link')}
          />
        </div>
      {/if}
    {:else}
      <div>
        <SpinnerButton
          disabled={$hasChanges}
          appearance="default"
          onClick={shareForm}
          label={$_('create_public_link')}
        />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .share-container {
    padding: 1rem;
    min-width: 28rem;
    max-width: 30rem;

    .description {
      color: var(--neutral-900);
      margin-top: 0.2rem;
    }
    .content {
      margin-top: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: var(--sm1);

      .share-control-options {
        display: flex;
        justify-content: space-between;
      }
    }
  }
</style>
