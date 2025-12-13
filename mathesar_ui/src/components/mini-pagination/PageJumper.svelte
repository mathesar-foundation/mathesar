<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import type Pagination from '@mathesar/utils/Pagination';
  import {
    Button,
    InputGroup,
    Label,
    LabelController,
    NumberInput,
    iconChooseItemManyAhead,
    iconChooseItemManyPrior,
  } from '@mathesar-component-library';

  const labelController = new LabelController();
  const numberFormatter = new Intl.NumberFormat();

  export let pagination: Pagination;
  export let recordCount: number;
  export let goToPage: (page: number) => void;

  let { page } = pagination;
  let input: HTMLInputElement;

  $: maxPage = pagination.getMaxPage(recordCount);

  onMount(() => {
    input.focus();
    input.select();
  });
</script>

<div class="page-jumper">
  <Button
    appearance="plain"
    tooltip={$_('first_page')}
    on:click={() => goToPage(1)}
    disabled={pagination.page === 1}
  >
    <Icon {...iconChooseItemManyPrior} />
  </Button>

  <div class="center">
    <form on:submit={() => goToPage(page)} class="form">
      <Label controller={labelController}>{$_('go_to_page')}</Label>
      <div class="input">
        <InputGroup>
          <NumberInput
            {labelController}
            bind:value={page}
            bind:element={input}
            useGrouping={'auto'}
          />
          <Button appearance="primary" type="submit">{$_('go')}</Button>
        </InputGroup>
      </div>
    </form>
    <div class="help">
      {$_('total_pages')}: {numberFormatter.format(maxPage)}
    </div>
  </div>

  <Button
    appearance="plain"
    tooltip={$_('last_page')}
    on:click={() => goToPage(maxPage)}
    disabled={pagination.page === maxPage}
  >
    <Icon {...iconChooseItemManyAhead} />
  </Button>
</div>

<style>
  .page-jumper {
    display: grid;
    grid-template: auto / auto auto auto;
    gap: var(--sm4);
  }
  .page-jumper > :global(span) {
    display: grid;
  }
  .page-jumper .form {
    display: contents;
  }
  .center {
    display: grid;
    justify-items: center;
  }
  .input {
    width: 7em;
  }
  .help {
    font-size: var(--sm1);
    color: var(--color-fg-base-disabled);
  }
</style>
