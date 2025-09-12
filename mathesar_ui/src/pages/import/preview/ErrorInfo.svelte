<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

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
    <Button appearance="danger" on:click={() => dispatch('delete')}>
      <Icon {...iconDeleteMajor} />
      <span>{$_('delete_import')}</span>
    </Button>
  </div>
</ErrorBox>

<style lang="scss">
  .title {
    font-size: var(--lg1);
  }
  .buttons {
    margin-top: var(--sm3);
    display: flex;
    align-items: center;

    > span {
      margin: 0 var(--sm4);
    }
  }
</style>
