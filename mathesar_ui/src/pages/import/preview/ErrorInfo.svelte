<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Button, Icon } from '@mathesar-component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';

  const dispatch = createEventDispatcher();

  export let error: string;
</script>

<ErrorBox fullWidth>
  <div class="title">
    {$_('failed_load_preview')}
  </div>
  <div>{error}</div>
  <div class="buttons">
    <Button appearance="primary" on:click={() => dispatch('retry')}>
      {$_('retry')}
    </Button>
    <span>{$_('or')}</span>
    <Button appearance="outline-primary" on:click={() => dispatch('delete')}>
      <Icon {...iconDeleteMajor} />
      <span>{$_('delete_import')}</span>
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
