<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Icon } from '@mathesar-component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { LL } from '@mathesar/i18n/i18n-svelte';

  const dispatch = createEventDispatcher();

  export let errors: string[];
</script>

<ErrorBox fullWidth>
  <div class="title">{$LL.importPreview.failedToLoadPreview()}</div>
  <div>{errors.join(',')}</div>
  <div class="buttons">
    <Button appearance="primary" on:click={() => dispatch('retry')}>
      {$LL.general.retry()}
    </Button>
    <span>or</span>
    <Button appearance="outline-primary" on:click={() => dispatch('delete')}>
      <Icon {...iconDeleteMajor} />
      <span>{$LL.importPreview.deleteImport()}</span>
    </Button>
  </div>
</ErrorBox>

<style lang="scss">
  .title {
    font-size: var(--text-size-large);
  }
  .buttons {
    margin-top: var(--size-xx-small);
    display: flex;
    align-items: center;

    > span {
      margin: 0 var(--size-ultra-small);
    }
  }
</style>
